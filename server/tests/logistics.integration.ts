import { test, before, after, beforeEach, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
process.env.NODE_ENV='test'; process.env.MONGODB_URI='mongodb://127.0.0.1:27017/never_connect_from_env'; process.env.JWT_SECRET='integration-test-only'; process.env.OPENAI_API_KEY='test-only-not-real'; process.env.OPENAI_MODEL='test-model';
const mongoose=require('mongoose');
const { MongoMemoryReplSet }=require('mongodb-memory-server');
const { Resource }=require('../src/models/Resource'); const { Shelter }=require('../src/models/Shelter');
const { StorageLocation, ShelterNeed, SupplyTransfer, ShelterStock, StockMovement, AssistantQuota }=require('../src/models/Logistics');
const handlers=require('../src/controllers/logisticsController');
const { updateResource, deleteResource }=require('../src/controllers/resourceController');
const { deleteShelter }=require('../src/controllers/shelterController');
const { User }=require('../src/models/User');
const models=[User,Resource,Shelter,StorageLocation,ShelterNeed,SupplyTransfer,ShelterStock,StockMovement,AssistantQuota];
let repl: any; const user='000000000000000000000001';
before(async()=>{ repl=await MongoMemoryReplSet.create({replSet:{count:1,storageEngine:'wiredTiger'}}); await mongoose.connect(repl.getUri()); await Promise.all(models.map(m=>m.init())); });
after(async()=>{await mongoose.disconnect(); if(repl) await repl.stop();});
beforeEach(async()=>{await Promise.all(models.map(m=>m.deleteMany({})));});
afterEach(()=>mock.restoreAll());
function run(handler:any,body:any={},id?:string):Promise<any>{return new Promise(resolve=>{let status=200;const res:any={status:(s:number)=>{status=s;return res;},json:(data:any)=>resolve({status,...data})};handler({body,params:{id},user:{id:user,role:'authority'}},res,(e:any)=>resolve({status:e.statusCode||500,error:e.message}));});}
async function setup(stock=100,demand=200){
 const shelter=await Shelter.create({name:'Relief shelter',location:{latitude:22.3,longitude:73.2,address:'Waghodia Road'},capacity:2000,currentOccupancy:1200,contactInfo:'On site coordinator'});
 const storage=await StorageLocation.create({name:'Central warehouse',kind:'WAREHOUSE',address:'Depot road',latitude:22.2,longitude:73.1,createdBy:user});
 const resource=await Resource.create({name:'Water bottles',category:'Water',unit:'bottles',quantity:stock,availableQuantity:stock});
 assert.equal((await run(handlers.bindStorage,{resourceId:String(resource._id),storageId:String(storage._id)})).status,200);
 const result=await run(handlers.createNeed,{shelterId:String(shelter._id),item:'Water bottles',category:'Water',unit:'bottles',requested:demand,urgency:'HIGH'});
 assert.equal(result.status,201);return {shelter,resource,need:result.need,storage};
}
const reservation=(s:any,quantity:number,key=randomUUID())=>({needId:String(s.need._id),resourceId:String(s.resource._id),quantity,requestKey:key});
test('reservation, dispatch, receipt and consumption conserve stock and are idempotent',async()=>{
 const s=await setup();const body=reservation(s,60);const r=await run(handlers.reserveTransfer,body);assert.equal(r.status,201);
 const duplicate=await run(handlers.reserveTransfer,body);assert.equal(String(duplicate.transfer._id),String(r.transfer._id));
 const id=String(r.transfer._id);
 assert.equal((await run(handlers.transitionTransfer,{status:'RECEIVED'},id)).status,409);
 assert.equal((await run(handlers.transitionTransfer,{status:'DISPATCHED'},id)).status,200);
 assert.equal((await run(handlers.transitionTransfer,{status:'CANCELLED'},id)).status,409);
 assert.equal((await run(handlers.transitionTransfer,{status:'RECEIVED'},id)).status,200);
 assert.equal((await run(handlers.transitionTransfer,{status:'RECEIVED'},id)).status,200);
 const stock=await ShelterStock.findOne();assert.equal(stock.quantity,60);
 const consumption={stockId:String(stock._id),quantity:20,notes:'Daily distribution',requestKey:randomUUID()};
 assert.equal((await run(handlers.consumeStock,consumption)).status,200);assert.equal((await run(handlers.consumeStock,consumption)).status,200);
 const source=await Resource.findById(s.resource._id);const final=await ShelterStock.findById(stock._id);const need=await ShelterNeed.findById(s.need._id);
 assert.equal(source.quantity,40);assert.equal(source.availableQuantity,40);assert.equal(source.shelterReserved,0);
 assert.equal(final.quantity,40);assert.equal(final.consumed,20);assert.equal(source.quantity+final.quantity+final.consumed,100);
 assert.equal(need.fulfilled,60);assert.equal(need.committed,0);assert.equal(await StockMovement.countDocuments(),4);
 assert.equal((await run(handlers.consumeStock,{...consumption,requestKey:randomUUID(),quantity:41})).status,409);
});
test('concurrent reservations cannot overspend stock',async()=>{
 const s=await setup();const result=await Promise.all([run(handlers.reserveTransfer,reservation(s,60)),run(handlers.reserveTransfer,reservation(s,60))]);
 assert.deepEqual(result.map(r=>r.status).sort(),[201,409]);assert.equal((await Resource.findById(s.resource._id)).availableQuantity,40);assert.equal(await SupplyTransfer.countDocuments(),1);
});
test('concurrent reservations cannot exceed unmet demand',async()=>{
 const s=await setup(200,70);const result=await Promise.all([run(handlers.reserveTransfer,reservation(s,50)),run(handlers.reserveTransfer,reservation(s,50))]);
 assert.deepEqual(result.map(r=>r.status).sort(),[201,409]);assert.equal((await ShelterNeed.findById(s.need._id)).committed,50);
});
test('cancellation returns reservation exactly once and quantity edits preserve reserved stock',async()=>{
 const s=await setup();const r=await run(handlers.reserveTransfer,reservation(s,60));
 assert.equal((await run(updateResource,{quantity:50},String(s.resource._id))).status,400);
 assert.equal((await run(updateResource,{quantity:80},String(s.resource._id))).status,200);assert.equal((await Resource.findById(s.resource._id)).availableQuantity,20);
 for(let i=0;i<2;i++)assert.equal((await run(handlers.transitionTransfer,{status:'CANCELLED'},String(r.transfer._id))).status,200);
 assert.equal((await Resource.findById(s.resource._id)).availableQuantity,80);assert.equal((await ShelterNeed.findById(s.need._id)).committed,0);
 assert.equal(await StockMovement.countDocuments({action:'CANCELLED'}),1);
});
test('transaction rolls back inventory and demand if ledger persistence fails',async()=>{
 const s=await setup();mock.method(StockMovement,'create',async()=>{throw new Error('Simulated ledger failure');});
 assert.equal((await run(handlers.reserveTransfer,reservation(s,60))).status,500);
 assert.equal((await Resource.findById(s.resource._id)).availableQuantity,100);assert.equal((await ShelterNeed.findById(s.need._id)).committed,0);assert.equal(await SupplyTransfer.countDocuments(),0);
});
test('linked shelter/resource history cannot be deleted or renamed',async()=>{
 const s=await setup();assert.equal((await run(deleteResource,{},String(s.resource._id))).status,409);assert.equal((await run(deleteShelter,{},String(s.shelter._id))).status,409);assert.equal((await run(updateResource,{name:'Rice'},String(s.resource._id))).status,409);
});
test('suggestions exclude mismatched units and maintenance stock; no stock is reserved by reading',async()=>{
 const s=await setup();let result=await handlers.suggestionsForNeed(String(s.need._id));assert.equal(result.suggestions.length,1);assert.equal(result.uncovered,100);assert.equal(result.suggestions[0].suggestedQuantity,100);
 await Resource.updateOne({_id:s.resource._id},{$set:{unit:'litres'}});result=await handlers.suggestionsForNeed(String(s.need._id));assert.equal(result.suggestions.length,0);
 await Resource.updateOne({_id:s.resource._id},{$set:{unit:'bottles',status:'MAINTENANCE'}});result=await handlers.suggestionsForNeed(String(s.need._id));assert.equal(result.suggestions.length,0);assert.equal(await SupplyTransfer.countDocuments(),0);
});


test('logistics routes reject unauthenticated, citizen, volunteer and deactivated accounts',async()=>{
 const express=require('express'), jwt=require('jsonwebtoken');
 const app=express();app.use(express.json());app.use('/logistics',require('../src/routes/logisticsRoutes').default);
 app.use((e:any,_req:any,res:any,_next:any)=>res.status(e.statusCode||500).json({message:e.message}));
 const server=await new Promise<any>(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
 try {
  const url='http://127.0.0.1:'+server.address().port+'/logistics/assistant';
  assert.equal((await fetch(url)).status,401);
  for(const role of ['citizen','volunteer','authority','admin']) {
   const account=await User.create({name:'Test account',email:role+'@example.test',password:'Test123!',role});
   const token=jwt.sign({id:String(account._id),role:'admin'},'integration-test-only');
   const headers={Authorization:'Bearer '+token};
   assert.equal((await fetch(url,{headers})).status,['authority','admin'].includes(role)?200:403);
   await User.updateOne({_id:account._id},{isActive:false});
   assert.equal((await fetch(url,{headers})).status,401);
  }
 } finally {await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('AI quota is persistent and enforces concurrent interval, daily cap and day reset',async()=>{
 const { askAssistant }=require('../src/controllers/assistantController');
 const { incidentReportDay }=require('../src/utils/incidentPolicy');
 let providerCalls=0;
 mock.method(globalThis,'fetch',async()=>{providerCalls++;return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text:'No recorded demand.'}]}]})};});
 const day=incidentReportDay(new Date());
 await AssistantQuota.create({_id:user,day,count:0,lastAt:new Date(0)});
 const results=await Promise.all([run(askAssistant,{question:'Where is demand?'}),run(askAssistant,{question:'Where is demand?'})]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,429]);assert.equal(providerCalls,1);
 await AssistantQuota.updateOne({_id:user},{count:20,lastAt:new Date(0)});
 assert.equal((await run(askAssistant,{question:'Where is demand?'})).status,429);assert.equal(providerCalls,1);
 await AssistantQuota.updateOne({_id:user},{day:'2000-01-01',lastAt:new Date(0)});
 assert.equal((await run(askAssistant,{question:'Where is demand?'})).status,200);assert.equal((await AssistantQuota.findById(user)).count,1);
});
