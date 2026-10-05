import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// Never connect tests to the configured application database.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/drecs_tests_not_connected';
process.env.JWT_SECRET = 'local-test-secret';
const { Types } = require('mongoose');
const { Incident } = require('../src/models/Incident');
const { User } = require('../src/models/User');
const { Assignment } = require('../src/models/Assignment');
const { Shelter } = require('../src/models/Shelter');
const { Notification } = require('../src/models/Notification');
const incidents = require('../src/controllers/incidentController');
const { getMapIncidents } = require('../src/controllers/mapController');
const { createVolunteerRequest } = require('../src/controllers/volunteerRequestController');
const { updateAssignmentStatus } = require('../src/controllers/assignmentController');
const { createShelter, updateShelter } = require('../src/controllers/shelterController');
const { createIncidentSchema, createVolunteerRequestSchema } = require('../src/utils/validators');
const { incidentReportDay, canOfferHelp } = require('../src/utils/incidentPolicy');
const { roleGuard } = require('../src/middleware/roleGuard');

afterEach(() => mock.restoreAll());
const reporter = '000000000000000000000001';
const other = '000000000000000000000002';
const id = '000000000000000000000003';
const validReport = { title: 'Water entering homes', description: 'Flood water has reached the ground floor.', category: 'Flood', severity: 'HIGH', location: { latitude: 23, longitude: 72 } };

function document(extra: Record<string, unknown> = {}) {
  return { _id: new Types.ObjectId(id), ...validReport, status: 'REPORTED', approvalStatus: 'PENDING',
    reportedBy: new Types.ObjectId(reporter), statusHistory: [], images: [],
    populate: async function () { return this; }, save: async function () { return this; }, ...extra };
}
function run(handler: any, request: any = {}): Promise<any> {
  return new Promise(resolve => {
    let status = 200;
    const res: any = { status: (value: number) => { status = value; return res; }, json: (body: any) => resolve({ status, body }) };
    handler({ user: { id: reporter, role: 'citizen' }, params: { id }, body: {}, query: {}, ...request }, res,
      (error: any) => resolve({ status: error?.statusCode, error }));
  });
}
function notifications() {
  mock.method(User, 'find', () => ({ select: async () => [] }));
  mock.method(Notification, 'create', async (data: any) => ({ _id: new Types.ObjectId(), ...data }));
}

test('calendar limit resets exactly at midnight India time', () => {
  assert.equal(incidentReportDay(new Date('2026-10-04T18:29:59Z')), '2026-10-04');
  assert.equal(incidentReportDay(new Date('2026-10-04T18:30:00Z')), '2026-10-05');
});
test('incident form validates bounds and does not classify or override severity', () => {
  assert.equal(createIncidentSchema.parse(validReport).severity, 'HIGH');
  for (const latitude of ['', null, undefined]) {
    assert.equal(createIncidentSchema.safeParse({ ...validReport, location: { latitude, longitude: 72 } }).success, false);
  }
  assert.equal(createIncidentSchema.safeParse({ ...validReport, location: { latitude: 91, longitude: 72 } }).success, false);
  assert.equal(createIncidentSchema.safeParse({ ...validReport, title: '   ' }).success, false);
});
test('offer help rejects empty fields, invalid phones, excessive skills, and stripped markup', () => {
  const valid = { skills: ['First aid'], experience: 'Trained in first aid', message: 'I can assist with medical supplies', phoneNumber: '9876543210' };
  assert.equal(createVolunteerRequestSchema.safeParse(valid).success, true);
  for (const patch of [{ skills: [] }, { skills: Array(11).fill('Rescue') }, { experience: ' ' }, { message: '<b></b>' }, { phoneNumber: 'abcdefghij' }, { phoneNumber: '0000000000' }, { phoneNumber: '98765432101' }, { phoneNumber: '+919876543210' }, { phoneNumber: '987654321' }, { phoneNumber: '98765 43210' }]) {
    assert.equal(createVolunteerRequestSchema.safeParse({ ...valid, ...patch }).success, false);
  }
});
test('new reports are pending and preserve the submitted severity', async () => {
  mock.method(Incident, 'countDocuments', async () => 0);
  notifications();
  let reservation: any;
  mock.method(User, 'findOneAndUpdate', async (filter: any, update: any) => { reservation = { filter, update }; return {}; });
  mock.method(Incident, 'create', async (data: any) => document(data));
  const result = await run(incidents.createIncident, { body: validReport });
  assert.equal(result.status, 201);
  assert.equal(result.body.incident.approvalStatus, 'PENDING');
  assert.equal(result.body.incident.severity, 'HIGH');
  assert.equal('aiSeverity' in result.body.incident, false);
  assert.equal(reservation.filter._id, reporter);
  assert.equal(reservation.filter.$or[1].incidentReportCount.$lt, 5);
  assert.ok(Array.isArray(reservation.update), 'reservation is an atomic Mongo update pipeline');
});
test('sixth report receives 429 without creating a report', async () => {
  mock.method(Incident, 'countDocuments', async () => 0);
  mock.method(User, 'findOneAndUpdate', async () => null);
  const create = mock.method(Incident, 'create', async () => assert.fail('must not create'));
  assert.equal((await run(incidents.createIncident, { body: validReport })).status, 429);
  assert.equal(create.mock.callCount(), 0);
});
test('reports created before quota deployment count toward the daily limit', async () => {
  mock.method(Incident, 'countDocuments', async () => 5);
  const reservation = mock.method(User, 'findOneAndUpdate', async () => assert.fail('must not reserve'));
  assert.equal((await run(incidents.createIncident, { body: validReport })).status, 429);
  assert.equal(reservation.mock.callCount(), 0);
});
test('account password requirements remain intact after removing report moderation', () => {
  const { validatePasswordSecurity } = require('../src/utils/passwordSecurity');
  assert.equal(validatePasswordSecurity('weak').isValid, false);
  assert.equal(validatePasswordSecurity('StrongPassword123!').isValid, true);
});
test('failed persistence releases the reserved daily slot', async () => {
  mock.method(Incident, 'countDocuments', async () => 0);
  mock.method(User, 'findOneAndUpdate', async () => ({}));
  mock.method(Incident, 'create', async () => { throw new Error('test failure'); });
  let update: any;
  mock.method(User, 'updateOne', async (_filter: any, data: any) => { update = data; });
  assert.equal((await run(incidents.createIncident, { body: validReport })).error.message, 'test failure');
  assert.equal(update.$inc.incidentReportCount, -1);
});
for (const approvalStatus of ['PENDING', 'REJECTED']) {
  test(`${approvalStatus} reports cannot be opened by another citizen`, async () => {
    mock.method(Incident, 'findById', async () => document({ approvalStatus }));
    assert.equal((await run(incidents.getIncidentById, { user: { id: other, role: 'citizen' } })).status, 404);
  });
}
test('reporter and authorities can inspect pending reports', async () => {
  mock.method(Incident, 'findById', async () => document());
  assert.equal((await run(incidents.getIncidentById)).status, 200);
  assert.equal((await run(incidents.getIncidentById, { user: { id: other, role: 'authority' } })).status, 200);
});
test('public filters cannot override approval requirement', async () => {
  let filter: any;
  mock.method(Incident, 'find', (value: any) => { filter = value; return { sort: () => ({ populate: async () => [] }) }; });
  await run(incidents.getPublicIncidents, { query: { status: 'REPORTED', approvalStatus: 'PENDING' } });
  assert.equal(filter.approvalStatus, 'APPROVED');
});
test('community map filters pending reports while authority map includes them', async () => {
  const filters: any[] = [];
  mock.method(Incident, 'find', (filter: any) => { filters.push(filter); return { select: () => ({ sort: () => ({ lean: async () => [] }) }) }; });
  await run(getMapIncidents);
  await run(getMapIncidents, { user: { id: other, role: 'authority' } });
  assert.deepEqual(filters, [{ approvalStatus: 'APPROVED' }, {}]);
});
test('approval creates public status and audit record; rejection stays private', async () => {
  notifications();
  for (const status of ['APPROVED', 'REJECTED']) {
    const item = document();
    mock.method(Incident, 'findById', async () => item);
    const result = await run(incidents.reviewIncident, { body: { status }, user: { id: other, role: 'authority' } });
    assert.equal(result.body.incident.approvalStatus, status);
    assert.equal(result.body.incident.status, status === 'APPROVED' ? 'UNDER_REVIEW' : 'REPORTED');
    assert.equal(item.statusHistory.length, 1);
    assert.equal(item.reviewedBy.toString(), other);
  }
});
test('a reviewed report cannot be reviewed again', async () => {
  mock.method(Incident, 'findById', async () => document({ approvalStatus: 'APPROVED' }));
  assert.equal((await run(incidents.reviewIncident, { body: { status: 'REJECTED' } })).status, 409);
});
test('citizens cannot access authority-only review actions', () => {
  let error: any;
  roleGuard('authority', 'admin')({ user: { role: 'citizen' } }, {}, (err: any) => { error = err; });
  assert.equal(error.statusCode, 403);
});
test('response status cannot bypass approval or skip directly to closed', async () => {
  mock.method(Incident, 'findById', async () => document());
  assert.equal((await run(incidents.updateIncidentStatus, { body: { status: 'ASSIGNED' } })).status, 400);
  mock.method(Incident, 'findById', async () => document({ approvalStatus: 'APPROVED', status: 'UNDER_REVIEW' }));
  assert.equal((await run(incidents.updateIncidentStatus, { body: { status: 'CLOSED' } })).status, 400);
});
test('assignment and resolution require consistent responder state', async () => {
  mock.method(Incident, 'findById', async () => document({ approvalStatus: 'APPROVED', status: 'UNDER_REVIEW' }));
  mock.method(Assignment, 'countDocuments', async () => 0);
  assert.equal((await run(incidents.updateIncidentStatus, { body: { status: 'ASSIGNED' } })).status, 400);
  mock.method(Assignment, 'exists', async () => ({}));
  assert.equal((await run(incidents.updateIncidentStatus, { body: { status: 'RESOLVED' } })).status, 400);
});
test('volunteer offers remain open during active response, never for unapproved or terminal reports', async () => {
  for (const status of ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS']) assert.equal(canOfferHelp({ approvalStatus: 'APPROVED', status }), true);
  for (const status of ['RESOLVED', 'CLOSED']) assert.equal(canOfferHelp({ approvalStatus: 'APPROVED', status }), false);
  mock.method(Incident, 'findById', async () => document());
  assert.equal((await run(createVolunteerRequest)).status, 400);
});
test('task owners cannot skip acceptance or complete someone else’s task', async () => {
  mock.method(Assignment, 'findById', async () => ({ volunteerId: new Types.ObjectId(reporter), incidentId: id, status: 'ASSIGNED' }));
  mock.method(Incident, 'findById', async () => document({ approvalStatus: 'APPROVED', status: 'ASSIGNED' }));
  assert.equal((await run(updateAssignmentStatus, { body: { status: 'COMPLETED' } })).status, 400);
  assert.equal((await run(updateAssignmentStatus, { body: { status: 'ACCEPTED' }, user: { id: other } })).status, 403);
});
test('starting a task advances the incident once; completion leaves resolution to authority', async () => {
  notifications();
  const incident = document({ approvalStatus: 'APPROVED', status: 'ASSIGNED' });
  const assignment = { _id: new Types.ObjectId(), volunteerId: new Types.ObjectId(reporter), incidentId: new Types.ObjectId(id), status: 'ACCEPTED', save: async () => {}, populate: async () => {} };
  mock.method(Assignment, 'findById', async () => assignment);
  mock.method(Incident, 'findById', async () => incident);
  const advance = mock.method(Incident, 'findOneAndUpdate', async (_filter: any, update: any) => { incident.status = update.$set.status; return incident; });
  assert.equal((await run(updateAssignmentStatus, { body: { status: 'IN_PROGRESS' } })).status, 200);
  assert.equal(incident.status, 'IN_PROGRESS');
  assert.equal((await run(updateAssignmentStatus, { body: { status: 'COMPLETED' } })).status, 200);
  assert.equal(incident.status, 'IN_PROGRESS');
  assert.equal(advance.mock.callCount(), 1);
});
test('shelter creation derives FULL from capacity and keeps inactive shelters inactive', async () => {
  mock.method(Shelter, 'create', async (data: any) => ({ _id: new Types.ObjectId(), ...data }));
  const full = await run(createShelter, { body: { capacity: 10, currentOccupancy: 10, status: 'ACTIVE' } });
  assert.equal(full.body.shelter.status, 'FULL');
  const inactive = await run(createShelter, { body: { capacity: 10, currentOccupancy: 10, status: 'INACTIVE' } });
  assert.equal(inactive.body.shelter.status, 'INACTIVE');
});
test('shelter updates reopen space and reject over-capacity occupancy', async () => {
  mock.method(Shelter, 'findById', async () => ({ _id: new Types.ObjectId(id), capacity: 10, currentOccupancy: 10, status: 'FULL', save: async () => {} }));
  assert.equal((await run(updateShelter, { body: { currentOccupancy: 9 } })).body.shelter.status, 'ACTIVE');
  assert.equal((await run(updateShelter, { body: { currentOccupancy: 11 } })).status, 400);
});


test('all resource categories offered by the client validate and create successfully', async () => {
  const { readFileSync } = require('node:fs');
  const { resolve } = require('node:path');
  const { Resource, RESOURCE_CATEGORIES } = require('../src/models/Resource');
  const { createResourceSchema } = require('../src/utils/validators');
  const { createResource } = require('../src/controllers/resourceController');
  const constants = readFileSync(resolve(__dirname, '../../client/src/lib/constants.ts'), 'utf8');
  const block = constants.split('export const RESOURCE_CATEGORIES = [')[1].split('] as const')[0];
  const clientCategories = [...block.matchAll(/'([^']+)'/g)].map((match: any) => match[1]);
  assert.deepEqual(clientCategories, RESOURCE_CATEGORIES);
  mock.method(Resource, 'create', async (data: any) => ({ _id: new Types.ObjectId(id), ...data }));
  for (const category of clientCategories) {
    const body = createResourceSchema.parse({ name: 'Emergency supplies', category, quantity: 100, unit: 'boxes', location: { address: 'Shelter XYZ' } });
    const result = await run(createResource, { user: { id: reporter, role: 'authority' }, body });
    assert.equal(result.status, 201);
    assert.equal(result.body.resource.availableQuantity, 100);
  }
});

test('resource validation rejects invalid stock and malformed fields before persistence', () => {
  const { createResourceSchema, updateResourceSchema, allocateResourceSchema } = require('../src/utils/validators');
  const valid = { name: 'Water bottles', category: 'Water', quantity: 100, unit: 'bottles' };
  for (const patch of [{ name: ' ' }, { category: 'Food & Water' }, { quantity: -1 }, { quantity: null }, { quantity: 1.5 }, { quantity: Infinity }, { unit: ' ' }, { location: { latitude: 91 } }]) {
    assert.equal(createResourceSchema.safeParse({ ...valid, ...patch }).success, false);
  }
  assert.equal(createResourceSchema.safeParse({ ...valid, quantity: 0 }).success, true);
  assert.equal(updateResourceSchema.safeParse({}).success, false);
  assert.deepEqual(updateResourceSchema.parse({ name: 'Fresh water' }), { name: 'Fresh water' });
  assert.equal(allocateResourceSchema.safeParse({ incidentId: id, quantity: 0.5 }).success, false);
});

for (const role of ['citizen', 'authority', 'admin']) {
  test('analytics restricts every incident counter to approved reports for ' + role, async () => {
    const { Resource } = require('../src/models/Resource');
    const { getOverviewStats } = require('../src/controllers/analyticsController');
    const filters: any[] = [];
    mock.method(Incident, 'countDocuments', async (filter: any) => { filters.push(filter); return 1; });
    mock.method(Shelter, 'countDocuments', async () => 1);
    mock.method(Shelter, 'aggregate', async () => [{ totalCapacity: 1123, totalOccupancy: 1122 }]);
    mock.method(Resource, 'countDocuments', async () => 0);
    mock.method(Resource, 'aggregate', async () => []);
    mock.method(User, 'countDocuments', async () => 0);
    mock.method(Assignment, 'countDocuments', async () => 0);
    const result = await run(getOverviewStats, { user: { id: reporter, role } });
    assert.equal(result.status, 200);
    assert.equal(filters.length, 4);
    assert.ok(filters.every(filter => filter.approvalStatus === 'APPROVED'));
    assert.equal(result.body.overview.shelterOccupancyRate, 99);
  });
}

test('incident charts filter pending and rejected reports before grouping', async () => {
  const { getIncidentTrends } = require('../src/controllers/analyticsController');
  const pipelines: any[] = [];
  mock.method(Incident, 'aggregate', async (pipeline: any) => { pipelines.push(pipeline); return []; });
  assert.equal((await run(getIncidentTrends)).status, 200);
  assert.equal(pipelines.length, 3);
  for (const pipeline of pipelines) assert.deepEqual(pipeline[0], { $match: { approvalStatus: 'APPROVED' } });
});
