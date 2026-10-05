# DRECS — Disaster Response & Emergency Coordination System

DRECS coordinates incident reports, authority review, volunteer response, shelters, resources, and notifications.

## Architecture

- **Client:** Next.js 14 App Router, React, TypeScript, Tailwind, Leaflet, and Recharts. Pages live in client/src/app; API wrappers in client/src/lib; authentication and socket connections are shared providers.
- **API:** Express and TypeScript. Routes authenticate JWTs against the current user record, apply role guards and body validation, and call controllers.
- **Persistence:** MongoDB with Mongoose models for users, incidents, volunteer requests, assignments, shelters, resources, and notifications.
- **Live updates:** Authenticated Socket.IO connections receive their own notifications and data invalidation events. Pages re-fetch through their authorized API on changes, reconnect, focus, and every 30 seconds while visible. Form drafts remain in place.

## Incident workflow

1. A citizen or volunteer submits a title, description, category, severity, and a point selected on the map. Browser location is an optional explicit action. Coordinate inputs are not exposed in the report form.
2. The report starts with approvalStatus=PENDING and response status REPORTED. Only its reporter and authority/admin users can inspect it. Public listings, map markers, and community statistics require explicit approval.
3. An authority opens the report from Dashboard and selects **Approve report** or **Reject report**. The decision is recorded in the timeline and sent to the reporter as a notification. Approval makes the report public and normally moves it to UNDER_REVIEW. Rejection leaves it private.
4. Approved active incidents accept volunteer offers. Skills, experience, an explanation of help, and a reachable phone number are required. A user may have only one pending/approved offer per incident; rejected users can reapply.
5. Authority approval of a volunteer offer creates an assignment and moves an incident awaiting responders to ASSIGNED. These writes run together in a MongoDB transaction.
6. The responder moves their task through ASSIGNED → ACCEPTED → IN_PROGRESS → COMPLETED. Starting a task moves an ASSIGNED incident to IN_PROGRESS. Completing a task does not resolve the incident; the authority decides that.
7. Authorities can resolve an approved incident only after all assignments are completed or removed. RESOLVED can move to CLOSED; CLOSED is terminal. No new offers, assignments, or resource allocations are accepted for terminal incidents.

The incident response transitions are centralized in server/src/utils/incidentPolicy.ts. Authority forms show the permitted next states. Authorities can also begin response or resolve an incident without volunteer assignments, for example when their own team handles it. Removing the last pending assignment returns an ASSIGNED incident to UNDER_REVIEW; completed task history is retained.

**No AI is used in reporting.** The submitted severity is preserved. The OpenAI dependency and verification utilities have been removed. Text length, sanitization, field validation, daily limits, and authority review remain.

## Daily spam prevention

Each user can submit **5 incident reports per calendar day**, resetting at **00:00 Asia/Kolkata (UTC+05:30)**. An atomic per-user reservation enforces the limit across concurrent submissions and application instances. Existing reports created earlier that day also count. Failed report persistence releases the reservation. The API returns HTTP 429 when the limit is reached.

## Screens and state rules

- **Dashboard** contains incident lists, status/category/severity filters, and authority approval filters. The previous /incidents and /incidents/my list routes redirect here.
- **Shelters:** Cards are read-only. Click Edit, change the form, then Save Changes or Cancel. ACTIVE/FULL follow occupancy automatically; INACTIVE is preserved. Occupancy cannot exceed capacity.
- **Resources:** Availability determines AVAILABLE, LOW_STOCK (below 20%), or DEPLETED. MAINTENANCE is retained and blocks allocations. Allocation details are authority-only.
- **Volunteer Force:** Summary counts, search by responder/email/incident, task status filtering, incident links, status badges, and assignment removal controls.
- **Notifications:** The navbar bell displays an unread count and recent messages. New notifications appear as dismissible popups. Opening one marks it read; the Notifications page retains history.
- **Sidebar:** The separate Incidents item and bottom footer text have been removed.

## Setup

Install dependencies in both directories using npm install. Use Node.js 20+ and a MongoDB replica set or Atlas deployment (transactions are required for volunteer approvals).

Create server/.env with your own values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/drecs?replicaSet=rs0
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:3000
```

Create client/.env.local:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Run npm run dev in server and client, then visit http://localhost:3000.

## Existing data

Reports without an approval field are treated as pending; they are intentionally hidden from the community until an authority reviews them. Historical AI fields may remain in stored documents but are no longer used or returned. No existing database records are automatically approved or deleted.

A partial unique index named active_offer_per_incident prevents simultaneous duplicate pending/approved volunteer offers. Before deploying onto an existing database, check for duplicate active offers for each incident/user and reconcile them before building this index. Mongoose creates the index when automatic indexing is enabled; deployments with autoIndex disabled must apply model indexes through their normal migration process. Do not blindly drop existing indexes or delete request history.

## Verification

- server: npm test runs workflow/controller tests with mocked persistence and a real local Socket.IO authentication test. Both client and server dependencies must be installed for the socket client test.
- server: npm run build compiles the API.
- client: npm run build validates types and creates the production build.
- Optional UI preview: run node tests/ui-preview.cjs from server with the client on port 3000. This loopback-only fixture API uses in-memory sample data and never connects to MongoDB. Sign in using authority@example.test or citizen@example.test and any nonempty password. Stop it before starting the real API; it uses port 5000.

Controller tests do not replace integration testing against a disposable MongoDB replica set, especially for transactions, unique-index migration, and concurrent quota enforcement. The UI fixture validates screen behavior only, not backend authorization.
