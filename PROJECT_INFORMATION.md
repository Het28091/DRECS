# Project Information — DRECS

Last updated: 5 October 2026. This document distinguishes implemented behaviour from proposed extensions. See [README](README.md) for environment setup and migration notes.

## Architecture and access

DRECS uses Next.js 14/React/TypeScript for the client, Express/TypeScript for the API, MongoDB/Mongoose for persistence, Leaflet for maps, Recharts for charts, and Socket.IO for updates. Browser requests carry a JWT; the API checks the current user and role. Authority/admin users review reports, manage shelters/resources, and assign responders. Citizens/volunteers report incidents and offer help.

Main models: User, Incident, VolunteerRequest, Assignment, Shelter, Resource, Notification. Routes are in `server/src/routes`, business rules in controllers and `utils/incidentPolicy.ts`, validation in `utils/validators.ts`, and database constraints in models. Client pages are in `client/src/app`, with API wrappers in `client/src/lib`.

## Validation reference

Validation runs on the server even if browser validation is bypassed. Invalid request bodies return HTTP 400 with field errors. Regex validates a format, not identity or ownership.

| Field | Implemented rule |
| --- | --- |
| Registration name | Trimmed, 2–100 characters; HTML sanitization |
| Email | Zod email validation, trimmed and lowercased; duplicate accounts rejected |
| Password | At least 8 characters, uppercase, lowercase, digit, and a supported special character |
| Offer-help phone | Exactly 10 ASCII digits after trimming; repeated identical digits rejected |
| Incident title | 3–120 characters after validation/sanitization |
| Incident description | 10–2000 characters; must differ from title |
| Incident category/severity | Enumerated values; severity is supplied by the reporter, not AI |
| Location | Required map point; latitude −90…90, longitude −180…180; optional address ≤300 characters |
| Volunteer skills | 1–10 entries, each 2–80 characters |
| Volunteer experience/message | 10–2000 / 10–1000 characters |
| Shelter capacity/occupancy | Integer capacity ≥1, integer occupancy ≥0 and ≤capacity |
| Shelter contact | Text 3–200 characters; may contain contact instructions, not restricted to a phone number |
| Resource name/unit | Trimmed name 2–120 characters; unit 1–40 characters |
| Resource quantity | Finite whole number ≥0; allocation is a whole number ≥1 and ≤available stock |
| Resource address/dispatch notes | Optional, ≤300 characters |
| MongoDB identifiers | `/^[a-f\d]{24}$/i` |

Phone format:

```js
const validFormat = /^\d{10}$/.test(phone.trim());
const repeatedDigits = /^(.)\1+$/.test(phone.trim());
const validPhone = validFormat && !repeatedDigits;
```

Example accepted: `9876543210`. Rejected: `98765432101`, `+919876543210`, `98765 43210`, `0000000000`. The input has `maxLength=10`, numeric keyboard hints, and a matching HTML pattern; the API independently enforces the rule. Country codes are not accepted. This is a ten-digit contact-number policy, not an Indian-mobile-prefix or OTP verification policy. Existing stored phone values are not rewritten.

Password checks are intentionally separate to provide useful feedback. These are the actual expressions used by registration on both client and server:

```js
password.length >= 8
/[A-Z]/.test(password)
/[a-z]/.test(password)
/[0-9]/.test(password)
/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
```

All checks must pass. Passwords are not trimmed; whitespace does not count as the required special character. Password hashing uses bcryptjs. These are the application's current complexity rules, not a claim of compliance with a security standard.

## Approval and status effects

Approval and operational progress are separate fields. A new report is `PENDING` + `REPORTED`; only its reporter and authority/admin can inspect it. Approval makes it public and moves it to `UNDER_REVIEW`. Rejection keeps it private. Incident analytics counters and status/category/severity charts include only `APPROVED` reports, including when an authority views analytics. The authority review queue still includes pending reports.

| Event/status | Actual business effect |
| --- | --- |
| Volunteer offer PENDING | Awaits review; one pending/approved offer per user per incident |
| Offer APPROVED | Creates an ASSIGNED task and moves a waiting incident to ASSIGNED in a transaction |
| Offer REJECTED | Does not create a task; the user may apply again |
| Task ACCEPTED | Records the responder's commitment; no inventory movement |
| Task IN_PROGRESS | Moves an ASSIGNED incident to IN_PROGRESS and records history |
| Task COMPLETED | Completes that responder's task; authority still decides incident resolution |
| Incident RESOLVED | Requires no unfinished assignments; blocks new help and resource allocations |
| Incident CLOSED | Terminal state following RESOLVED |
| Assignment removed | Rejects its linked offer; removing the last active assignment from an ASSIGNED incident returns it to UNDER_REVIEW |

Permitted incident transitions: `REPORTED → UNDER_REVIEW`; `UNDER_REVIEW → ASSIGNED / IN_PROGRESS / RESOLVED`; `ASSIGNED → IN_PROGRESS / RESOLVED`; `IN_PROGRESS → RESOLVED`; `RESOLVED → CLOSED`. Approval is required before operational changes. ASSIGNED requires an active assignment. Authorities can handle an incident with their own team without volunteer assignments. Completed assignment history is retained.

These statuses already have logical consequences. Do not automatically mark an incident resolved when one volunteer finishes, or automatically return supplies when an incident closes: other responders may still be working and supplies may have been consumed. A future completion checklist could require an outcome note and explicit accounting of deliveries/returns before closure.

## Shelters and inventory today

Shelter cards are read-only until Edit is clicked. ACTIVE/FULL derive from occupancy; INACTIVE remains an explicit override. Displayed occupancy uses `floor(occupancy / capacity × 100)`: 1122/1123 is 99%, while 1123/1123 is 100%. Analytics uses the same rounding policy.

Resource categories are Food, Water, Medical, Shelter Supplies, Vehicle/Transport, Equipment, Personnel, Other. Client dropdown values now match the API. The former client-only categories (Food & Water, Rescue Gear, Power & Generators, Vehicles) caused `400 Invalid resource category` during creation. Rescue equipment/generators can use Equipment; vehicles use Vehicle/Transport. Invalid names, units, quantities and locations now return field validation messages before persistence.

Available quantity is total minus active allocations. Allocation reserves stock for an approved active incident; release returns that reservation. Status is DEPLETED at zero availability, LOW_STOCK below 20% of total, otherwise AVAILABLE. MAINTENANCE is an explicit override that blocks allocation. Merely selecting a stock status does not change quantities.

The storage address describes where stock currently sits. It is currently free text, not a Shelter reference. Entering “Shelter XYZ” does not create a database link, update shelter supplies, or record a delivery. Allocation is to an incident, not to a shelter. The current module tracks reservations, not consumption or verified deliveries. Do not interpret Release as a physical return of already-consumed water.

## Recommended extension: shelter supply management (not implemented)

Link the modules with explicit entities instead of inferring relationships from address text:

1. StorageLocation: warehouse or shelter; optional validated `shelterId`, address, coordinates and responsible authority.
2. InventoryLot: resource type, unit, storage location, total/available/reserved quantity; optional expiry for consumables.
3. ShelterNeed: shelter, item/unit, requested quantity, fulfilled quantity, urgency, reporting time and deadline. Occupancy alone cannot establish how much water is needed.
4. Transfer: source lot, destination shelter/incident, quantity, actor and timestamps, with `REQUESTED → RESERVED → DISPATCHED → RECEIVED`; cancellation/return must follow explicit rules.
5. An append-only stock ledger records receipts, reservations, dispatch, returns and consumption. Never delete history to adjust a balance.

Example: warehouse stock is 100 bottles; Shelter XYZ requests 2000 bottles. Reserve 100, leaving zero available; dispatch and confirm receipt; remaining demand is 1900 bottles. This calculation assumes a recorded request of 2000 bottles, not merely 2000 residents. Consumables and reusable equipment need different return rules.

Dependencies: schema/API changes, shelter selector and stock screens, unit consistency, migration of existing free-text locations, role checks, atomic stock updates, idempotent transfer actions, audit history and tests for concurrent allocation/cancellation. Multi-document updates can use [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/) on a replica set or sharded deployment. The existing volunteer-review flow already needs transaction-capable MongoDB.

## Recommended extension: decision support, then AI (not implemented)

Start with deterministic features: unmet-demand dashboard, low-stock alerts, expiry alerts, matching supplies to recorded needs, responder availability/skills filters, and a completion checklist. These provide useful behaviour without an AI service.

A later read-only assistant could answer “Which shelters need water?”, summarize approved incidents, explain shortages, and propose allocations with record links, quantities and last-updated timestamps. Server functions should retrieve authorized current data and calculate balances; the model explains their results. It should say when demand/location data is missing rather than inventing it. Different roles must see only the records and contact details their normal API permits.

Dependencies: reliable shelter demand and stock ledger first; a model provider and server-only credentials; constrained read-only query tools; authorization on every tool call; prompt-injection handling for report text; request limits and cost/latency monitoring; evaluation scenarios for stale, missing and conflicting data. Keep changes as proposals requiring authority confirmation, with a fresh stock check at execution. A vector database is not necessary for initial structured inventory queries; document search can be added later for manuals/SOPs.

Nearby-supply matching needs accurate coordinates and distance queries. [MongoDB geospatial queries](https://www.mongodb.com/docs/manual/geospatial-queries/) support GeoJSON and geospatial indexes; adopting them would require converting/indexing the current coordinate fields. Road travel time or route safety requires an additional routing source and current operational data; straight-line distance does not establish a safe route.

## Refresh, notifications and spam controls

Socket.IO authenticates JWTs and assigns user/role rooms server-side. Successful writes invalidate relevant client data; pages refetch on events, reconnect, focus and every 30 seconds while visible. Draft forms are retained. Notifications have a bell count, history and dismissible popups.

Each user may submit five incident reports per India calendar day (00:00 Asia/Kolkata reset). An atomic reservation prevents concurrent requests bypassing the quota. Failed persistence releases the slot. The quota returns HTTP 429; rejection of a submitted report does not grant a replacement slot.

## Verification and operational notes

Run `npm test` and `npm run build` in server, and `npm run build` in client. Workflow tests mock database calls and do not modify real data. The socket test uses a loopback listener. A production build does not prove live MongoDB connectivity or real browser geolocation permissions.

Regression coverage includes authority visibility, status guards, five-report quota, phone length, resource-category parity/creation, invalid resource bodies, approved-only analytics and 99% occupancy. Manually verify map and GPS error clearing, resource creation for each category, and two-account live refresh against a test database before deployment. MongoDB transactions and the active-offer unique index must be available; see README migration notes.

Troubleshooting: 400 means invalid input (read field errors); 401 means sign-in required; 403 means insufficient role; 409 means a conflicting edit/duplicate; 429 means the report quota was reached. A remaining 500 needs the exact response and server log to diagnose; do not assume every resource failure was the category mismatch. Keep credentials and real personal data out of logs and screenshots.
