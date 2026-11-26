# API Reference

Base URL: `http://localhost:5000/api`. Request and response bodies use JSON. Protected endpoints require `Authorization: Bearer <token>`. The `/public` incident route means community-visible records; authentication is still required.

This is an endpoint and workflow reference, not a generated OpenAPI specification. Exact payload schemas are in `server/src/utils/validators.ts`, `logisticsValidation.ts` and route-local schemas.

## Endpoint groups

| Method and path | Purpose | Access |
| --- | --- | --- |
| `POST /auth/register` | Create citizen account | Unauthenticated |
| `POST /auth/login` | Authenticate and issue token | Unauthenticated |
| `GET /auth/me` | Read current account | Authenticated |
| `POST /auth/logout` | Acknowledge logout; client clears session | No token revocation |
| `POST /incidents` | Submit incident | Citizen/volunteer |
| `GET /incidents/my` | Own reports | Citizen/volunteer |
| `GET /incidents/public` | Verified community reports | Authenticated |
| `GET /incidents` | Management report list | Management |
| `GET /incidents/:id` | Read incident with visibility checks | Authorized viewer |
| `PATCH /incidents/:id/review` | Approve/reject publication | Management |
| `PATCH /incidents/:id/status` | Record response decision and reason | Management |
| `POST /incidents/:id/volunteer-request` | Share help offer immediately | Citizen/volunteer |
| `GET /incidents/:id/volunteer-requests` | Read incident offers | Management |
| `GET /volunteer-requests` | List offers | Management |
| `GET /volunteer-requests/my` | Own offers | Authenticated owner |
| `PATCH /volunteer-requests/:id` | Update or withdraw own offer | Owner |
| `GET /incidents/:id/coordination` | Latest private thread messages | Participant/management |
| `POST /incidents/:id/coordination` | Send private message | Participant/management |
| `GET /shelters`, `GET /shelters/:id` | Read shelters | Authenticated |
| `POST /shelters`, `PATCH /shelters/:id`, `DELETE /shelters/:id` | Manage shelters; linked-history restrictions apply | Management |
| `GET /resources`, `GET /resources/:id` | Read inventory | Authenticated |
| `POST /resources`, `PATCH /resources/:id`, `DELETE /resources/:id` | Manage source stock; linked-history restrictions apply | Management |
| `POST /resources/:id/allocate` | Reserve stock for incident | Management |
| `POST /resources/:id/release` | Release incident reservation | Management |
| `GET /logistics` | Read supply data; optional `shelterId` filters movement history | Management |
| `POST /logistics/storage` | Create source location | Management |
| `POST /logistics/storage/link` | Link existing inventory | Management |
| `POST /logistics/needs` | Record shelter demand | Management |
| `GET /logistics/needs/:id/suggestions` | Find compatible source stock | Management |
| `POST /logistics/transfers` | Reserve or reserve and dispatch | Management |
| `PATCH /logistics/transfers/:id` | Dispatch, receive, cancel, return or record damage | Management |
| `POST /logistics/consume` | Record received stock usage | Management |
| `GET /locations/search?q=...` | Search place/address | Authenticated |
| `GET /map/incidents` | Map records respecting visibility | Authenticated |
| `POST /chatbot` | Generate concise disaster guidance | Authenticated |
| `GET /notifications` | Own notifications | Authenticated |
| `PATCH /notifications/read-all`, `PATCH /notifications/:id/read` | Mark own notifications read | Authenticated owner |
| `GET /analytics/overview` | Summary counters with publication filtering | Authenticated |
| `GET /analytics/incidents/trends` | Incident chart data | Management |
| `GET /analytics/volunteers/activity` | Participation chart data | Management |
| `GET /analytics/resources/utilization` | Inventory chart data | Management |
| `GET /admin/users`, `GET /admin/overview` | Administration data | Admin |
| `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/status` | Manage account role/active state | Admin |

Management means `authority` or `admin`. Historical read routes remain at `/assignments/my`, `/assignments/my/access`, `/assignments/incident/:incidentId`, `/volunteers` and `/volunteers/:id`, with owner or management restrictions. Old assignment mutations, volunteer-offer approval and supply-assistant endpoints are disabled.

## Request examples

Replace identifier placeholders with real record IDs. Use a new UUID for each logical retryable action and retain the same UUID for retries of that action.

Response decision, `PATCH /incidents/:id/status`:

```json
{ "status": "RESOLVED", "note": "Management confirmed the reported hazard has been addressed." }
```

Help offer, `POST /incidents/:id/volunteer-request`:

```json
{
  "availability": "Today, 14:00–17:00",
  "message": "Available to assist with shelter supply distribution.",
  "phoneNumber": "9815263740",
  "skills": ["Supply distribution"]
}
```

Private coordination, `POST /incidents/:id/coordination`:

```json
{ "text": "Please confirm your current availability.", "requestKey": "00000000-0000-4000-8000-000000000001", "personId": "<participant-id>" }
```

Management selects a participant using `personId` in a message body or `?person=<participant-id>` when reading. Ordinary participants omit it and can access only their own thread.

Send supplies, `POST /logistics/transfers`:

```json
{ "needId": "<need-id>", "resourceId": "<resource-id>", "quantity": 100, "sendNow": true, "requestKey": "00000000-0000-4000-8000-000000000002" }
```

Partial receipt, `PATCH /logistics/transfers/:id`:

```json
{ "status": "RECEIVED", "quantity": 80, "requestKey": "00000000-0000-4000-8000-000000000003" }
```

Chat, `POST /chatbot`:

```json
{ "message": "How can I update my help offer?", "history": [] }
```

A successful chat returns `{ "answer": "..." }`. Optional history contains at most six messages alternating `{ "role": "user", "text": "..." }` and `{ "role": "model", "text": "..." }`, starting with user and ending with model. Model and system-instruction overrides are not accepted.

## Error behavior

Validation generally returns `400` with a message and field errors where available. Authentication uses `401`, forbidden access `403`, absent records `404`, conflicts `409` and request limits `429`. Chat provider failures use controlled `502`/`503` responses; a `429` includes `Retry-After`. Clients must handle failures rather than assume every JSON response represents success. Generic server errors do not expose stack traces.
