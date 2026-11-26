import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://127.0.0.1/never-use-env";
process.env.JWT_SECRET = "offer-tests";
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const { User } = require("../src/models/User");
const { Incident } = require("../src/models/Incident");
const { VolunteerRequest } = require("../src/models/VolunteerRequest");
const { Assignment } = require("../src/models/Assignment");
const { Resource } = require("../src/models/Resource");
const { CoordinationMessage } = require("../src/models/CoordinationMessage");
const {
  createVolunteerRequest,
  updateOwnOffer,
} = require("../src/controllers/volunteerRequestController");
const {
  updateIncidentStatus,
} = require("../src/controllers/incidentController");
const {
  listCoordination,
  sendCoordination,
} = require("../src/routes/coordinationRoutes");
let replica: any, citizen: any, other: any, manager: any;
before(async () => {
  replica = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replica.getUri());
  await Promise.all(Object.values(mongoose.models).map((m: any) => m.init()));
});
after(async () => {
  await mongoose.disconnect();
  await replica.stop();
});
beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.models).map((m: any) => m.deleteMany({})),
  );
  [citizen, other, manager] = await User.create([
    {
      name: "Reporter",
      email: "reporter@test.example",
      password: "Test123!",
      role: "citizen",
    },
    {
      name: "Helper",
      email: "helper@test.example",
      password: "Test123!",
      role: "volunteer",
    },
    {
      name: "Manager",
      email: "manager@test.example",
      password: "Test123!",
      role: "admin",
    },
  ]);
});
function run(
  handler: any,
  id: string,
  body: any = {},
  account = citizen,
  query: any = {},
): Promise<any> {
  return new Promise((resolve) => {
    let status = 200;
    const res: any = {
      status: (s: number) => {
        status = s;
        return res;
      },
      json: (data: any) => resolve({ status, ...data }),
    };
    handler(
      {
        params: { id },
        body,
        query,
        user: { id: String(account._id), role: account.role },
      },
      res,
      (e: any) => resolve({ status: e.statusCode || 500, error: e.message }),
    );
  });
}
async function report(approvalStatus = "APPROVED") {
  return Incident.create({
    title: "Flood at road",
    description: "Sample report for response coordination testing",
    category: "Flood",
    severity: "HIGH",
    status: approvalStatus === "APPROVED" ? "UNDER_REVIEW" : "REPORTED",
    approvalStatus,
    reportedBy: citizen._id,
    location: { latitude: 22.3, longitude: 73.2 },
  });
}
const offer = {
  message: "I can distribute supplies",
  availability: "Today afternoon",
  phoneNumber: "9815263740",
  skills: [],
  experience: "",
};
test("help offer is immediately visible and creates no assignment or response status change", async () => {
  const i = await report();
  const r = await run(createVolunteerRequest, String(i._id), offer, other);
  assert.equal(r.status, 201);
  assert.equal(await Assignment.countDocuments(), 0);
  assert.equal((await Incident.findById(i._id)).status, "UNDER_REVIEW");
  assert.equal(r.request.availability, "Today afternoon");
});
test("simultaneous duplicate offers create only one record", async () => {
  const i = await report();
  const r = await Promise.all([
    run(createVolunteerRequest, String(i._id), offer, other),
    run(createVolunteerRequest, String(i._id), offer, other),
  ]);
  assert.deepEqual(r.map((x) => x.status).sort(), [201, 409]);
  assert.equal(await VolunteerRequest.countDocuments(), 1);
});
test("offer owner can edit or withdraw; another user cannot; history remains", async () => {
  const i = await report();
  const r = await run(createVolunteerRequest, String(i._id), offer, other);
  assert.equal(
    (await run(updateOwnOffer, r.request.id, { availability: "Tomorrow" }))
      .status,
    404,
  );
  assert.equal(
    (
      await run(
        updateOwnOffer,
        r.request.id,
        { availability: "Tomorrow" },
        other,
      )
    ).status,
    200,
  );
  assert.equal(
    (await run(updateOwnOffer, r.request.id, { status: "WITHDRAWN" }, other))
      .status,
    200,
  );
  assert.equal(await VolunteerRequest.countDocuments(), 1);
  assert.equal((await Incident.findById(i._id)).status, "UNDER_REVIEW");
});
test("resolution works with no offers and also with unfinished legacy assignments and allocations", async () => {
  for (const legacy of [false, true]) {
    const i = await report();
    if (legacy) {
      await run(createVolunteerRequest, String(i._id), offer, other);
      await Assignment.create({
        incidentId: i._id,
        volunteerId: other._id,
        status: "ASSIGNED",
      });
      await Resource.create({
        name: "Water",
        category: "Water",
        quantity: 10,
        availableQuantity: 5,
        allocations: [{ incidentId: i._id, quantity: 5 }],
      });
    }
    const r = await run(
      updateIncidentStatus,
      String(i._id),
      {
        status: "RESOLVED",
        note: "Management confirmed response is no longer needed",
      },
      manager,
    );
    assert.equal(r.status, 200);
    assert.equal(!!r.warning, legacy);
    if (legacy) {
      assert.equal((await Assignment.findOne()).status, "ASSIGNED");
      assert.equal((await Resource.findOne()).availableQuantity, 5);
    }
  }
});
test("resolution closes offers, retains history and can be reopened with a reason", async () => {
  const i = await report();
  const r = await run(createVolunteerRequest, String(i._id), offer, other);
  assert.equal(
    (
      await run(
        updateIncidentStatus,
        String(i._id),
        { status: "RESOLVED" },
        manager,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await run(
        updateIncidentStatus,
        String(i._id),
        { status: "RESOLVED", note: "Situation assessed" },
        manager,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await run(
        updateOwnOffer,
        r.request.id,
        { availability: "Tomorrow" },
        other,
      )
    ).status,
    409,
  );
  assert.equal(
    (await run(createVolunteerRequest, String(i._id), offer)).status,
    409,
  );
  assert.equal(
    (
      await run(
        updateIncidentStatus,
        String(i._id),
        { status: "IN_PROGRESS", note: "New flooding reported" },
        manager,
      )
    ).status,
    200,
  );
  assert.equal((await Incident.findById(i._id)).statusHistory.length, 2);
});
test("public verification is independent of management response", async () => {
  const i = await report("PENDING");
  assert.equal(
    (await run(createVolunteerRequest, String(i._id), offer, other)).status,
    409,
  );
  assert.equal(
    (
      await run(
        updateIncidentStatus,
        String(i._id),
        { status: "IN_PROGRESS", note: "Contacting local management" },
        manager,
      )
    ).status,
    200,
  );
  assert.equal((await Incident.findById(i._id)).approvalStatus, "PENDING");
});
test("join and resolution serialize without reopening a resolved incident", async () => {
  const i = await report();
  const r = await Promise.all([
    run(createVolunteerRequest, String(i._id), offer, other),
    run(
      updateIncidentStatus,
      String(i._id),
      { status: "RESOLVED", note: "Response assessed" },
      manager,
    ),
  ]);
  assert.equal(r[1].status, 200);
  assert.ok([201, 409].includes(r[0].status));
  assert.equal((await Incident.findById(i._id)).status, "RESOLVED");
});
test("reporter can privately message management before verification; outsiders cannot read", async () => {
  const i = await report("PENDING"),
    id = String(i._id);
  assert.equal(
    (
      await run(sendCoordination, id, {
        text: "The rear entrance is blocked",
        requestKey: randomUUID(),
      })
    ).status,
    201,
  );
  assert.equal(
    (await run(listCoordination, id, {}, manager)).messages.length,
    1,
  );
  assert.equal((await run(listCoordination, id, {}, other)).status, 403);
});
test("helpers cannot read another conversation; messages retry without duplication", async () => {
  const i = await report(),
    id = String(i._id);
  await run(createVolunteerRequest, id, offer, other);
  const body = { text: "Where should we meet?", requestKey: randomUUID() };
  assert.equal((await run(sendCoordination, id, body, other)).status, 201);
  assert.equal((await run(sendCoordination, id, body, other)).status, 200);
  assert.equal(
    (
      await run(listCoordination, id, {}, citizen, {
        person: String(other._id),
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await run(listCoordination, id, {}, manager, {
        person: String(other._id),
      })
    ).messages.length,
    1,
  );
  assert.equal(
    (await run(sendCoordination, id, { ...body, text: "different" }, other))
      .status,
    409,
  );
  assert.equal(await CoordinationMessage.countDocuments(), 1);
});
test("resolved conversations remain readable but refuse new messages", async () => {
  const i = await report(),
    id = String(i._id);
  await run(sendCoordination, id, {
    text: "Please advise",
    requestKey: randomUUID(),
  });
  await run(
    updateIncidentStatus,
    id,
    { status: "RESOLVED", note: "Response complete" },
    manager,
  );
  assert.equal(
    (
      await run(sendCoordination, id, {
        text: "Late message",
        requestKey: randomUUID(),
      })
    ).status,
    409,
  );
  assert.equal((await run(listCoordination, id)).readOnly, true);
});
test("HTTP routes enforce management access and disable legacy review/task mutations", async () => {
  const express = require("express"),
    http = require("http");
  const { apiRoutes } = require("../src/routes");
  const { errorHandler } = require("../src/middleware/errorHandler");
  const { generateAccessToken } = require("../src/utils/jwt");
  const app = express();
  app.use(express.json());
  app.use("/api", apiRoutes);
  app.use(errorHandler);
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    const i = await report(),
      base = "http://127.0.0.1:" + server.address().port + "/api";
    const headers = {
      "Content-Type": "application/json",
      Authorization:
        "Bearer " +
        generateAccessToken({
          id: String(citizen._id),
          role: citizen.role,
          email: citizen.email,
        }),
    };
    assert.equal(
      (
        await fetch(base + "/incidents/" + i._id + "/status", {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "RESOLVED", note: "unauthorized" }),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/assignments/" + i._id + "/status", {
          method: "PATCH",
          headers,
          body: "{}",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + "/volunteer-requests/" + i._id + "/status", {
          method: "PATCH",
          headers,
          body: "{}",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + "/logistics/assistant", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).status,
      403,
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("historical direct assignments retain private coordination access without requiring a new offer", async () => {
  const i = await report(),
    id = String(i._id);
  await Assignment.create({
    incidentId: i._id,
    volunteerId: other._id,
    status: "ACCEPTED",
  });
  assert.equal((await run(listCoordination, id, {}, other)).status, 200);
  assert.equal(
    (
      await run(
        sendCoordination,
        id,
        {
          text: "My historical assignment needs clarification",
          requestKey: randomUUID(),
        },
        other,
      )
    ).status,
    201,
  );
  assert.equal((await Incident.findById(id)).status, "UNDER_REVIEW");
});
