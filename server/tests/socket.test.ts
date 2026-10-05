import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/drecs_tests_not_connected';
process.env.JWT_SECRET = 'local-test-secret';
const { User } = require('../src/models/User');
const { initSocket } = require('../src/socket');
const { generateAccessToken } = require('../src/utils/jwt');
const { io: clientIO } = require('../../client/node_modules/socket.io-client');

test('notification sockets require valid authentication and cannot impersonate another room', { timeout: 10000 }, async t => {
  const userId = '000000000000000000000001';
  const mocked = mock.method(User, 'findById', () => ({ select: async () => ({ _id: userId, isActive: true, role: 'citizen' }) }));
  const httpServer = http.createServer();
  const io = initSocket(httpServer);
  httpServer.listen(0, '127.0.0.1');
  await once(httpServer, 'listening');
  const url = `http://127.0.0.1:${(httpServer.address() as any).port}`;
  const token = generateAccessToken({ id: userId, email: 'test@example.test', role: 'admin' });
  // Deliberately stale admin claim: the server must use the database role.
  const client = clientIO(url, { auth: { token }, transports: ['websocket'], reconnection: false, autoConnect: false });
  const invalid = clientIO(url, { auth: { token: 'invalid' }, transports: ['websocket'], reconnection: false, autoConnect: false });
  t.after(async () => { client.disconnect(); invalid.disconnect(); await new Promise<void>(resolve => io.close(() => resolve())); mocked.mock.restore(); });
  const connected = once(client, 'connect'); client.connect(); await connected;
  const serverSocket = io.sockets.sockets.get(client.id);
  assert.ok(serverSocket.rooms.has(`user:${userId}`));
  assert.ok(serverSocket.rooms.has('role:citizen'));
  assert.equal(serverSocket.rooms.has('role:admin'), false);
  const received = once(serverSocket, 'join_room');
  client.emit('join_room', { userId: 'someone-else', role: 'authority' });
  await received;
  assert.equal(serverSocket.rooms.has('user:someone-else'), false);
  assert.equal(serverSocket.rooms.has('role:authority'), false);
  const rejected = once(invalid, 'connect_error'); invalid.connect();
  const [error] = await rejected;
  assert.equal(error.message, 'Unauthorized');
});
