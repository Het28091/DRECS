import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV='test'; process.env.MONGODB_URI='mongodb://127.0.0.1/unused'; process.env.JWT_SECRET='test-only';
const v = require('../src/utils/validators');
const { queryGuard } = require('../src/middleware/queryGuard');
const { searchPlaces } = require('../src/routes/locationRoutes');
const { User } = require('../src/models/User');
const { getAllUsers } = require('../src/controllers/adminController');
afterEach(() => mock.restoreAll());
const shelter = { name:'Town hall', location:{latitude:0,longitude:0}, capacity:10, contactInfo:'desk@example.test' };
test('shelter coordinates require real numeric pairs; zero remains valid', () => {
 assert.equal(v.createShelterSchema.safeParse(shelter).success,true);
 for(const invalid of ['',null,false,'22',Infinity,NaN,undefined]) assert.equal(v.createShelterSchema.safeParse({...shelter,location:{latitude:invalid,longitude:0}}).success,false);
 assert.equal(v.updateShelterSchema.safeParse({location:{latitude:22}}).success,false);
});
test('required text is checked after sanitization and legitimate punctuation survives', () => {
 for(const field of ['name','contactInfo']) assert.equal(v.createShelterSchema.safeParse({...shelter,[field]:'<b></b>'}).success,false);
 assert.equal(v.createShelterSchema.safeParse({...shelter,facilities:['<b></b>']}).success,false);
 assert.equal(v.registerSchema.safeParse({name:'<b></b>',email:'a@b.test',password:'password123'}).success,false);
 assert.equal(v.sanitizeInputText("O'Brien & Sons — onload= instructions"),"O'Brien & Sons — onload= instructions");
});
test('quantity, array, image URL and password boundaries are enforced', () => {
 assert.equal(v.createShelterSchema.safeParse({...shelter,capacity:true}).success,false);
 assert.equal(v.createShelterSchema.safeParse({...shelter,capacity:1000001}).success,false);
 assert.equal(v.createShelterSchema.safeParse({...shelter,facilities:Array(21).fill('Water')}).success,false);
 const incident={title:'Flood report',description:'Water is entering houses',category:'Flood',severity:'HIGH',location:{latitude:22,longitude:73}};
 for(const url of ['javascript:alert(1)','data:image/png,x','http://example.com/image','https://user:pass@example.com/a']) assert.equal(v.createIncidentSchema.safeParse({...incident,images:[url]}).success,false);
 assert.equal(v.createIncidentSchema.safeParse({...incident,images:['https://example.com/image.png']}).success,true);
 assert.equal(v.registerSchema.safeParse({name:'Test User',email:'user@example.test',password:'🙂'.repeat(19)}).success,false);
 assert.equal(v.createResourceSchema.safeParse({name:'Water',category:'Water',quantity:10,location:{latitude:22}}).success,false);
 assert.equal(v.updateResourceSchema.safeParse({}).success,false);
});
test('query guard rejects Mongo operators, repeated values and oversized strings', () => {
 for(const query of [{status:{$ne:'ACTIVE'}},{status:['ACTIVE','FULL']},{search:'a'.repeat(301)},{isActive:'yes'}]) { let status=0; queryGuard({query},{status:(s:number)=>{status=s;return {json:()=>{}}}},()=>assert.fail()); assert.equal(status,400); }
 let passed=false;queryGuard({query:{search:"O'Brien",isActive:'true'}},{},()=>passed=true);assert.equal(passed,true);
});
function invoke(handler:any,req:any) {return new Promise<any>(resolve => handler(req,{json:(data:any)=>resolve({status:200,...data}),setHeader:()=>{}},(e:any)=>resolve({status:e.statusCode,message:e.message})));}
test('admin search treats regex punctuation literally',async()=>{
 let captured:any;mock.method(User,'find',(filter:any)=>{captured=filter;return {select:()=>({sort:async()=>[]})};});
 await invoke(getAllUsers,{query:{search:'(a+)+$'}});
 assert.equal(captured.$or[0].name.test('(a+)+$'),true);assert.equal(captured.$or[0].name.test('aaaa'),false);
});
test('place search validates input and provider results, caches and throttles',async()=>{
 assert.equal((await invoke(searchPlaces,{query:{q:{$ne:''}}})).status,400);
 let calls=0;mock.method(globalThis,'fetch',async()=>{calls++;return {ok:true,json:async()=>[{lat:'22.3',lon:'73.2',display_name:'Vadodara'},{lat:'999',lon:'73',display_name:'Invalid'}]};});
 const result=await invoke(searchPlaces,{query:{q:'Vadodara'}});assert.equal(result.status,200);assert.equal(result.results.length,1);
 await invoke(searchPlaces,{query:{q:'Vadodara'}});assert.equal(calls,1);
 assert.equal((await invoke(searchPlaces,{query:{q:'Surat'}})).status,429);
});

test('place search fails safely on provider errors and malformed responses',async()=>{
 mock.method(Date,'now',()=>2000000000000);
 mock.method(globalThis,'fetch',async()=>{throw new Error('network down');});
 assert.equal((await invoke(searchPlaces,{query:{q:'Network failure test'}})).status,503);
 mock.restoreAll();
 mock.method(Date,'now',()=>2000000002000);
 mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({unexpected:true})}));
 assert.equal((await invoke(searchPlaces,{query:{q:'Malformed result test'}})).status,503);
});


test('shelter contact accepts a mobile or email and rejects arbitrary text and placeholders', () => {
 for(const value of ['hello','Management desk','1234567890','9876543210','1111111111','not@email','<b>desk@example.test</b>']) assert.equal(v.contactSchema.safeParse(value).success,false,value);
 assert.equal(v.contactSchema.parse(' +91 98152 63740 '),'9815263740');
 assert.equal(v.contactSchema.parse(' Desk@Example.test '),'desk@example.test');
 assert.equal(v.updateShelterSchema.safeParse({contactInfo:'bad'}).success,false);
});
