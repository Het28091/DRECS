// Isolated UI fixture server. Never imports application configuration or MongoDB.
// Start manually alongside the client; all edits disappear when this process exits.
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000', credentials: true } });
const now = new Date().toISOString();
const users = {
  citizen: { id: '000000000000000000000001', name: 'Sample Citizen', role: 'citizen', email: 'citizen@example.test', isActive: true },
  authority: { id: '000000000000000000000002', name: 'Sample Authority', role: 'authority', email: 'authority@example.test', isActive: true },
};
let reports = [
  { id: '000000000000000000000011', title: 'Flooding near Riverside Road', description: 'Water has reached nearby homes. Residents need evacuation support and drinking water.', category: 'Flood', severity: 'HIGH', approvalStatus: 'APPROVED', status: 'UNDER_REVIEW', allowedTransitions: ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED'], location: { latitude: 23.0225, longitude: 72.5714, address: 'Riverside Road, Ahmedabad' }, reportedBy: users.authority, images: [], statusHistory: [], createdAt: now, updatedAt: now },
  { id: '000000000000000000000012', title: 'Fallen tree blocking hospital entrance', description: 'A large tree has fallen across the entrance. Emergency vehicles cannot enter the hospital.', category: 'Other', severity: 'MEDIUM', approvalStatus: 'PENDING', status: 'REPORTED', allowedTransitions: [], location: { latitude: 23.03, longitude: 72.58, address: 'City Hospital entrance' }, reportedBy: users.citizen, images: [], statusHistory: [], createdAt: now, updatedAt: now },
];
const shelters = [{ id: 'shelter-1', name: 'Community Relief Centre', location: { latitude: 23.03, longitude: 72.57, address: 'Town Hall, Ahmedabad' }, capacity: 100, currentOccupancy: 42, status: 'ACTIVE', facilities: ['Water', 'First aid', 'Bedding'], contactInfo: '+91 98765 43210' }];
let notices = [{ id: 'notice-1', title: 'Report awaiting approval', message: 'A report needs authority review.', recipient: users.authority.id, isRead: false, type: 'INCIDENT_UPDATE', link: '/incidents/000000000000000000000012', createdAt: now }];
io.on('connection', socket => { socket.join(socket.handshake.auth.token); });
app.post('/api/auth/login', (req, res) => { const role = req.body.email.startsWith('authority') ? 'authority' : 'citizen'; res.json({ success: true, user: users[role], token: role }); });
app.use('/api', (req, res, next) => {
  req.role = req.headers.authorization?.split(' ')[1];
  req.user = users[req.role];
  if (!req.user) return res.status(401).json({ message: 'Sign in to the local preview' });
  res.on('finish', () => { if (req.method !== 'GET' && res.statusCode < 400) io.emit('data_changed'); });
  next();
});
app.get('/api/auth/me', (req, res) => res.json({ success: true, user: req.user }));
app.get('/api/assignments/my/access', (_req, res) => res.json({ success: true, hasVolunteerCapability: false, activeAssignmentCount: 0 }));
app.get('/api/incidents/my', (req, res) => res.json({ incidents: reports.filter(i => i.reportedBy.id === req.user.id) }));
app.get('/api/incidents/public', (_req, res) => res.json({ incidents: reports.filter(i => i.approvalStatus === 'APPROVED') }));
app.get('/api/incidents', (_req, res) => res.json({ incidents: reports }));
app.get('/api/incidents/:id', (req, res) => res.json({ incident: reports.find(i => i.id === req.params.id) }));
app.patch('/api/incidents/:id/review', (req, res) => {
  const item = reports.find(i => i.id === req.params.id);
  item.approvalStatus = req.body.status;
  if (req.body.status === 'APPROVED') { item.status = 'UNDER_REVIEW'; item.allowedTransitions = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED']; }
  const notice = { id: `notice-${Date.now()}`, recipient: req.user.id, title: 'Report reviewed', message: 'The report is now approved for the community.', isRead: false, type: 'INCIDENT_UPDATE', link: `/incidents/${item.id}`, createdAt: now };
  notices.unshift(notice); io.to(req.role).emit('notification', notice);
  res.json({ incident: item });
});
app.post('/api/incidents', (req, res) => {
  const incident = { ...req.body, id: String(Date.now()), approvalStatus: 'PENDING', status: 'REPORTED', reportedBy: req.user, createdAt: now, updatedAt: now, images: [], statusHistory: [] };
  reports.push(incident); res.status(201).json({ incident });
});
app.get('/api/incidents/:id/volunteer-requests', (_req, res) => res.json({ requests: [] }));
app.get('/api/volunteer-requests/my', (_req, res) => res.json({ requests: [] }));
app.get('/api/volunteer-requests', (_req, res) => res.json({ requests: [] }));
app.get('/api/assignments/my', (_req, res) => res.json({ assignments: [] }));
app.get('/api/assignments/incident/:id', (_req, res) => res.json({ assignments: [] }));
app.get('/api/shelters', (_req, res) => res.json({ shelters }));
app.patch('/api/shelters/:id', (req, res) => { const shelter = shelters.find(s => s.id === req.params.id); Object.assign(shelter, req.body); res.json({ shelter }); });
app.get('/api/notifications', (req, res) => { const items = notices.filter(n => n.recipient === req.user.id); res.json({ notifications: items, unreadCount: items.filter(n => !n.isRead).length }); });
app.patch('/api/notifications/:id/read', (req, res) => { const item = notices.find(n => n.id === req.params.id); item.isRead = true; res.json({ notification: item }); });
app.get('/api/volunteers', (_req, res) => res.json({ volunteers: [{ ...users.citizen, activeIncidents: [{ id: reports[0].id, title: reports[0].title }], activeAssignments: [{ id: 'task-1', incidentId: reports[0].id, incidentTitle: reports[0].title, status: 'IN_PROGRESS' }] }] }));
app.use((_req, res) => res.status(404).json({ message: 'Not implemented in isolated preview' }));
server.listen(5000, '127.0.0.1', () => console.log('Isolated UI fixture API on localhost:5000; no database connection.'));
