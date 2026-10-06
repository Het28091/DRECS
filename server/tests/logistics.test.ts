import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
process.env.NODE_ENV = 'test'; process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/not_connected'; process.env.JWT_SECRET = 'test-secret';
const { isValidMobile } = require('../src/utils/phone');
const { shortage, matchesNeed, distanceKm, assertTransferAction } = require('../src/utils/logisticsPolicy');
const { reserveSchema, storageSchema, consumeSchema } = require('../src/utils/logisticsValidation');
const { generateAnswer } = require('../src/controllers/assistantController');
afterEach(() => mock.restoreAll());
test('Indian mobile plausibility rejects invalid prefixes and common placeholders', () => {
  for (const phone of ['1234567890','5876543210','9876543210','6789012345','9999999999','9898989898','9123491234','+919815263740','98152637400','abcdef1234']) assert.equal(isValidMobile(phone), false, phone);
  assert.equal(isValidMobile('9815263740'), true);
});
test('matching never mixes item names, categories or units', () => {
  const r = { name: 'Water Bottles', category: 'Water', unit: 'bottles' };
  assert.equal(matchesNeed(r, { item: ' water  bottles ', category: 'Water', unit: 'BOTTLES' }), true);
  assert.equal(matchesNeed(r, { item: 'Water Bottles', category: 'Water', unit: 'litres' }), false);
  assert.equal(matchesNeed(r, { item: 'Water tanks', category: 'Water', unit: 'bottles' }), false);
  assert.equal(shortage({ requested: 100, fulfilled: 20, committed: 30 }), 50);
});
test('distance is zero for identical points and sensible for one latitude degree', () => {
  assert.equal(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:0}),0);
  assert.equal(distanceKm({latitude:0,longitude:0},{latitude:1,longitude:0}),111.2);
});
test('transfers cannot skip dispatch, reopen receipts or cancel dispatched goods', () => {
  for (const pair of [['RESERVED','RECEIVED'],['DISPATCHED','CANCELLED'],['RECEIVED','DISPATCHED'],['CANCELLED','RESERVED']]) assert.throws(()=>assertTransferAction(...pair));
  assert.doesNotThrow(()=>assertTransferAction('DISPATCHED','RECEIVED'));
  assert.doesNotThrow(()=>assertTransferAction('RECEIVED','RECEIVED'));
});
test('write schemas reject fractions, oversized quantities, invalid references and missing consumption reasons', () => {
  const body = { needId: '000000000000000000000001', resourceId: '000000000000000000000002', requestKey:'81d024b8-7f61-4d46-a1f0-46037a0bd19a', quantity:1 };
  assert.equal(reserveSchema.safeParse(body).success,true);
  for (const quantity of [0,-1,1.1,Infinity,1000000001]) assert.equal(reserveSchema.safeParse({...body,quantity}).success,false);
  assert.equal(consumeSchema.safeParse({stockId:body.needId,quantity:1,requestKey:body.requestKey,notes:''}).success,false);
  assert.equal(storageSchema.safeParse({name:'Warehouse',kind:'WAREHOUSE',address:'Main road',latitude:91,longitude:72}).success,false);
});
test('AI request has no tools, does not store responses, and extracts text without executing content', async () => {
  let sent: any;
  mock.method(globalThis, 'fetch', async (_url: string, options: any) => { sent=JSON.parse(options.body); return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Review 20 bottles.'}]}]})}; });
  assert.equal(await generateAnswer('Help allocate water',{shortage:20}),'Review 20 bottles.');
  assert.equal(sent.store,false); assert.equal(sent.tools,undefined); assert.equal(sent.max_output_tokens,1800);
});
test('AI provider errors and incomplete responses return controlled errors', async () => {
  const fetch = mock.method(globalThis,'fetch',async()=>({ok:false,status:401}));
  await assert.rejects(()=>generateAnswer('help',{}), {statusCode:503});
  fetch.mock.mockImplementation(async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})}));
  await assert.rejects(()=>generateAnswer('help',{}), {statusCode:503});
});
