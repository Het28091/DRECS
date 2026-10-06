# Project Information — DRECS

Last updated: 6 October 2026. This document distinguishes implemented behaviour from proposed extensions. See [README](README.md) for environment setup and migration notes.

See [UI Review](UI_REVIEW.md) for the screen-by-screen review scope, fixed interaction issues, browser verification and remaining release checks. Password visibility toggles do not change validation rules. Responsive navigation and resource dialogs support keyboard use; failed loads now expose retry controls.

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
| Offer-help phone | 10 ASCII digits starting with 6–9; repeated and sequential placeholders rejected |
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

Phone format: `/^[6-9]\d{9}$/`. Client and server additionally use this plausibility policy:

```js
const validPhone = /^[6-9]\d{9}$/.test(phone)
  && !/^(\d)\1{9}$/.test(phone)
  && !/^(\d{2})\1{4}$/.test(phone)
  && !/^(\d{5})\1$/.test(phone)
  && !['01234567890123456789', '98765432109876543210']
    .some(sequence => sequence.includes(phone));
```

Example accepted by the format policy: `9815263740`. Rejected: `1234567890`, `9876543210`, `9999999999`, `9898989898`, `9123491234`, country codes, spaces, letters and numbers longer than 10 digits. The API trims surrounding whitespace. The input has maxLength=10 and HTML pattern `[6-9][0-9]{9}`; submit validation applies all extra checks. These are Indian mobile format/plausibility checks, not proof that a number exists or belongs to the user. A real number can match a blocked placeholder pattern; OTP verification is the appropriate future ownership check and requires a delivery provider, expiry, retry limits and abuse controls. Existing stored values are not rewritten.

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

Available quantity is source total minus active incident allocations and shelter reservations. Allocation reserves stock for an approved active incident; release returns that reservation. Status is DEPLETED at zero availability, LOW_STOCK below 20% of total, otherwise AVAILABLE. MAINTENANCE is an explicit override that blocks allocation. Merely selecting a stock status does not change quantities.

## Shelter supplies — implemented

Authority/admin users open **Shelter Supplies** in the sidebar. All /api/logistics routes authenticate the current account and reject other roles. Existing free-text resource addresses remain usable for incident allocations, but do not imply a shelter link.

1. **Storage:** create a warehouse (map coordinates required) or a shelter storage location. A shelter source copies the shelter address/coordinates at creation. Link an existing resource lot with no active incident allocations to that source. Each lot has one immutable source; create a separate lot for another source. Existing addresses are not automatically migrated.
2. **Needs:** record a shelter, item, category, unit, requested quantity and urgency. Demand is explicit; 2,000 residents do not automatically mean 2,000 bottles. Item and unit matching ignores case/extra spaces but does not convert bottles to litres.
3. **Suggestions:** calculate unmet demand as max(0, requested − fulfilled − committed), match available stock, exclude maintenance/inactive/same-shelter sources, and sort by straight-line distance. Suggested quantities together cannot exceed current unmet demand. Reading suggestions reserves nothing.
4. **Transfers:** review and confirm a quantity, then confirm dispatch when goods leave storage and receipt when physically delivered. Every mutation rechecks server state inside a MongoDB transaction.
5. **Shelter stock:** received goods become shelter on-hand stock. Record actual consumption with a reason. Consumption does not reopen a fulfilled request; create a new request for additional demand.

| Action | Source stock effect | Demand / destination effect |
| --- | --- | --- |
| RESERVED | available decreases; shelterReserved increases; total unchanged | committed increases |
| CANCELLED (only before dispatch) | available restored; shelterReserved decreases | committed decreases |
| DISPATCHED | source total and shelterReserved decrease; available unchanged | committed remains; shipment is in transit |
| RECEIVED | source unchanged | committed decreases, fulfilled and shelter on-hand increase |
| CONSUMED | source unchanged | on-hand decreases, cumulative consumed increases |

Example: start with 100 bottles, reserve/dispatch/receive 60, then consume 20. Source stock is 40, shelter on-hand is 40, consumed is 20: the original 100 bottles are accounted for. A 2,000-bottle request has 1,940 still unmet after receipt. Reserved or dispatched goods count as committed until cancelled or received.

Models: StorageLocation, ShelterNeed, SupplyTransfer, ShelterStock, StockMovement, AssistantQuota. Resource stores storageId/shelterReserved/logisticsLinked; Shelter stores logisticsLinked. Resource identity/unit/source and linked history cannot be deleted or relabelled through the API. Storage coordinates are a snapshot; no storage edit/move workflow exists yet. The ledger records transfer/consumption actions with actor, quantity and time; latest 100 are shown. Existing resource quantity adjustments remain the older stock-edit workflow and are not transfer ledger events. Received shelter stock is separate from source lots and cannot yet be retransferred. Returns, shipment loss, expiry/batches, need amendments/cancellation, and ledgered replenishment/corrections are future extensions, not implicit status effects.

Reservations/consumption use client-generated UUID request keys retained while a confirmation is retried. Reusing a key with different contents returns 409. Repeated same-status transfer actions do not duplicate stock. Concurrent writes use transactions, optimistic versions and unique indexes. MongoDB must be a replica set or sharded deployment; build the new model indexes through the normal migration process when autoIndex is disabled. No destructive migration or automatic data rewrite is performed.

Routes under /api/logistics: GET / (overview), POST /storage, POST /storage/link, POST /needs, GET /needs/:id/suggestions, POST /transfers, PATCH /transfers/:id, POST /consume, GET /assistant (configuration), POST /assistant (question). IDs, enum values, coordinates and quantities are validated; supply write quantities are whole numbers 1–1,000,000,000. Consumption requires a 3–500 character reason. Overview lists currently load all records except the latest-100 ledger; paginate before large-scale deployment.

## Contextual assistant — implemented, optional configuration

The Assistant tab is authority/admin-only and read-only. Set server-only **OPENAI_API_KEY** and **OPENAI_MODEL** to enable it. No model is assumed and no key belongs in client environment variables. Missing configuration leaves deterministic stock suggestions fully operational and disables the Ask button with an explanation.

The server sends the question and a current snapshot to the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses), with store=false, a 30-second timeout and at most 1,800 output tokens. The UI discloses this transmission before asking. Context includes the most recently updated 30 approved incidents, 30 shelters, 30 requests, aggregate assignment status counts for approved incidents, and optional selected-request stock suggestions. User/volunteer contact fields are not selected. Free-text questions and record titles/addresses may contain information entered by users; do not include private contact details in them. store=false is not a claim about all provider data retention policies.

Shortages, available quantities and distances come from server calculations. The model has no tools or write access. Its answer is plain text, supplied record links are generated locally, and record text is treated as untrusted input. AI output may still be wrong: review current stock suggestions, choose a quantity, and explicitly confirm the normal reservation dialog. The API rechecks stock/demand at confirmation. No AI response can directly approve an incident, dispatch goods, or alter inventory.

Persistent limits: 20 attempts per user per India calendar day and at least 10 seconds between questions. Provider failures consume an attempt; provider errors return controlled 503 responses. Output is a limited snapshot, not exhaustive knowledge of every record. Provider integration is tested with simulated responses; a paid live-provider call is not part of the repository test suite.

Nearby suggestions currently use Haversine distance with existing latitude/longitude fields. No vector database, routing provider or new MongoDB geospatial index is required. At larger scale, GeoJSON plus a 2dsphere index can reduce candidate scans. Straight-line distance does not establish road travel time or route safety. Future AI improvements depend on trustworthy demand/units, evaluations for stale/missing/conflicting records, cost monitoring, and optional document search for approved SOPs. Returns/loss handling, stock reconciliation and OTP ownership checks should precede autonomous operational actions.

## Refresh, notifications and spam controls

Socket.IO authenticates JWTs and assigns user/role rooms server-side. Successful writes invalidate relevant client data; pages refetch on events, reconnect, focus and every 30 seconds while visible. Draft forms are retained. Notifications have a bell count, history and dismissible popups.

Each user may submit five incident reports per India calendar day (00:00 Asia/Kolkata reset). An atomic reservation prevents concurrent requests bypassing the quota. Failed persistence releases the slot. The quota returns HTTP 429; rejection of a submitted report does not grant a replacement slot.

## Verification and operational notes

Run `npm test`, `npm run test:integration` and `npm run build` in server, and `npm run build` in client. Integration tests use mongodb-memory-server with an isolated temporary replica set, never MONGODB_URI; the first run downloads an official MongoDB binary. Node.js 20.19+ is required for this development dependency. Workflow tests mock database calls and do not modify real data. The socket test uses a loopback listener. A production build does not prove live MongoDB connectivity or real browser geolocation permissions.

Regression coverage includes authority visibility, status guards, five-report quota, phone length, resource-category parity/creation, invalid resource bodies, approved-only analytics and 99% occupancy. Manually verify map and GPS error clearing, resource creation for each category, and two-account live refresh against a test database before deployment. MongoDB transactions and the active-offer unique index must be available; see README migration notes.

Troubleshooting: 400 means invalid input (read field errors); 401 means sign-in required; 403 means insufficient role; 409 means a conflicting edit/duplicate; 429 means an incident or assistant quota/interval was reached. A remaining 500 needs the exact response and server log to diagnose; do not assume every resource failure was the category mismatch. Keep credentials and real personal data out of logs and screenshots.
