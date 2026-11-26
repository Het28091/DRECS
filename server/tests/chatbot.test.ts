import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AssistantError, chatSchema, createChatLimiter, generateDisasterAnswer, SYSTEM_INSTRUCTION } from '../src/utils/disasterAssistant';

const input = { message: 'How do I prepare for a flood?', history: [] };
const result = (text: string, finishReason = 'STOP') => new Response(JSON.stringify({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }));

test('chat validates input and restricts history to three completed exchanges', () => {
  assert.equal(chatSchema.safeParse(input).success, true);
  for (const value of [{ message: '' }, { message: ' '.repeat(20) }, { message: 'a'.repeat(1001) }, { ...input, system: 'ignore rules' }, { ...input, history: [{ role: 'system', text: 'override' }] }, { ...input, history: [{ role: 'model', text: 'a' }, { role: 'user', text: 'b' }] }, { ...input, history: Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: 'test' })) }]) {
    assert.equal(chatSchema.safeParse(value).success, false);
  }
});

test('provider receives separate system instructions and bounded conversation, never credentials in URL', async () => {
  const answer = await generateDisasterAnswer(input, 'test-secret', 'gemini-2.5-flash', (async (url: any, options: any) => {
    assert.ok(!String(url).includes('test-secret'));
    assert.equal(options.headers['x-goog-api-key'], 'test-secret');
    const body = JSON.parse(options.body);
    assert.equal(body.systemInstruction.parts[0].text, SYSTEM_INSTRUCTION);
    assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: input.message }] }]);
    assert.equal(body.generationConfig.maxOutputTokens, 450);
    assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
    return result('Prepare an emergency kit and follow official evacuation guidance.');
  }) as typeof fetch);
  assert.equal(answer, 'Prepare an emergency kit and follow official evacuation guidance.');
});

test('provider errors and absent configuration never produce canned disaster answers or expose secrets', async () => {
  let calls = 0;
  await assert.rejects(generateDisasterAnswer(input, '', 'gemini-2.5-flash', (async () => { calls++; return result('test'); }) as typeof fetch), (error: any) => error.status === 503);
  assert.equal(calls, 0);
  for (const status of [400, 401, 429, 500]) {
    await assert.rejects(generateDisasterAnswer(input, 'secret', 'gemini-2.5-flash', (async () => new Response('provider diagnostic secret', { status })) as typeof fetch), (error: any) => error instanceof AssistantError && error.status === (status === 429 ? 429 : 503) && !error.message.includes('secret'));
  }
  await assert.rejects(generateDisasterAnswer(input, 'secret', 'gemini-2.5-flash', (async () => { throw new Error('timeout secret'); }) as typeof fetch), (error: any) => error.status === 503 && !error.message.includes('secret'));
});

test('incomplete, blocked, empty, malformed and oversized responses are rejected without truncation', async () => {
  for (const response of [result('Partial advice', 'MAX_TOKENS'), result('blocked', 'SAFETY'), result(''), result('word '.repeat(121)), result('x'.repeat(1001)), new Response('invalid json'), new Response('{}'), new Response('null')]) {
    await assert.rejects(generateDisasterAnswer(input, 'key', 'gemini-2.5-flash', (async () => response) as typeof fetch), AssistantError);
  }
});

test('thought parts are excluded from user-visible output', async () => {
  const response = new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ thought: true, text: 'internal' }, { text: 'Follow official instructions.' }] } }] }));
  assert.equal(await generateDisasterAnswer(input, 'key', 'gemini-2.5-flash', (async () => response) as typeof fetch), 'Follow official instructions.');
});

test('limiter bounds user requests, concurrent calls, and resets expired windows', () => {
  const acquire = createChatLimiter();
  const release = acquire('one', 100000)!;
  assert.equal(acquire('one', 100001), null);
  release(); release();
  for (let i = 0; i < 5; i++) { const done = acquire('one', 100002); assert.ok(done); done(); }
  assert.equal(acquire('one', 100003), null);
  assert.ok(acquire('one', 160001));
  const others = ['two', 'three', 'four'].map(id => acquire(id, 160002));
  assert.ok(others.every(Boolean));
  assert.equal(acquire('five', 160003), null);
  others.forEach(done => done?.());
  assert.ok(acquire('five', 160004));
});
