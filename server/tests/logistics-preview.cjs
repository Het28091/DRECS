// Disposable integration preview. Never connects to the application's configured database.
process.env.NODE_ENV='test'; process.env.MONGODB_URI='mongodb://127.0.0.1:27017/unused'; process.env.JWT_SECRET='preview-only-secret'; process.env.OPENAI_API_KEY=''; process.env.OPENAI_MODEL=''; process.env.CLIENT_URL='http://localhost:3000';
require('ts-node/register/transpile-only');
const mongoose=require('mongoose'); const {MongoMemoryReplSet}=require('mongodb-memory-server'); const express=require('express'); const cors=require('cors'); const http=require('http');
const {apiRoutes}=require('../src/routes'); const {errorHandler}=require('../src/middleware/errorHandler'); const {initSocket,getIO}=require('../src/socket');
const {User}=require('../src/models/User'); const {Incident}=require('../src/models/Incident'); const {VolunteerRequest}=require('../src/models/VolunteerRequest'); const {Resource}=require('../src/models/Resource'); const {Shelter}=require('../src/models/Shelter');
const {StorageLocation,ShelterNeed}=require('../src/models/Logistics');
(async()=>{
 const repl=await MongoMemoryReplSet.create({replSet:{count:1,storageEngine:'wiredTiger'}}); await mongoose.connect(repl.getUri()); await Promise.all(Object.values(mongoose.models).map(m=>m.init()));
 const authority=await User.create({name:'Preview Authority',email:'authority@example.test',password:'Preview123!',role:'authority',isActive:true});
 const citizen=await User.create({name:'Preview Citizen',email:'citizen@example.test',password:'Preview123!',role:'citizen',isActive:true});
 const shelter=await Shelter.create({name:'Waghodia Relief Shelter',location:{latitude:22.3,longitude:73.24,address:'Waghodia Road, Vadodara 390025'},capacity:2100,currentOccupancy:2000,contactInfo:'Preview coordinator',logisticsLinked:true});
 const storage=await StorageLocation.create({name:'Central Supply Depot',kind:'WAREHOUSE',latitude:22.31,longitude:73.19,address:'Central Depot, Vadodara',createdBy:authority._id});
 await Resource.create({name:'Water bottles',category:'Water',unit:'bottles',quantity:100,availableQuantity:100,storageId:storage._id,logisticsLinked:true,location:{latitude:22.31,longitude:73.19,address:storage.address}});
 await ShelterNeed.create({shelterId:shelter._id,item:'Water bottles',category:'Water',unit:'bottles',requested:2000,urgency:'HIGH',createdBy:authority._id});
 for(const severity of ['LOW','MEDIUM','HIGH','CRITICAL']) { const incident=await Incident.create({title:severity+' sample incident',description:'Sample operational incident for isolated UI verification.',category:'Flood',severity,approvalStatus:'APPROVED',status:'UNDER_REVIEW',reportedBy:citizen._id,location:{latitude:22.3,longitude:73.2}}); await VolunteerRequest.create({userId:citizen._id,incidentId:incident._id,skills:['First aid'],experience:'Preview responder experience',message:'Preview offer of help',phoneNumber:'9815263740',status:severity==='LOW'?'REJECTED':severity==='MEDIUM'?'APPROVED':'PENDING'}); }
 const app=express();app.use(cors({origin:'http://localhost:3000',credentials:true}));app.use(express.json());const server=http.createServer(app);initSocket(server);
 app.use('/api',(req,res,next)=>{res.on('finish',()=>{if(req.user&&['POST','PATCH','DELETE'].includes(req.method)&&res.statusCode<400)getIO()?.to('authenticated').emit('data_changed');});next();},apiRoutes);app.use(errorHandler);
 server.listen(5000,'127.0.0.1',()=>console.log('Isolated real-API preview ready. Test login authority@example.test / Preview123!; type stop to clean up.'));
 let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;getIO()?.close();server.close();await mongoose.disconnect();await repl.stop();process.exit(0);};
 process.stdin.resume();process.stdin.on('data',data=>{if(String(data).trim()==='stop')void stop();});process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());setTimeout(()=>void stop(),30*60*1000).unref();
})().catch(e=>{console.error(e);process.exit(1);});
