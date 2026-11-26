# DRECS — Disaster Response & Emergency Coordination System

DRECS brings incident reporting, volunteer coordination, shelter management, inventory and supply delivery into one application. It is an English-language college demonstration designed to run locally with sample data and internet access.

Management decisions remain separate from volunteer availability and physical stock movements. The application supports coordination; it does not dispatch emergency services or verify conditions in the field.

## Capabilities

- **Incident reporting:** location-based reports, management verification, response status and decision history.
- **Help offers:** immediate sharing of availability and contact details, owner updates and withdrawal, private coordination with management.
- **Shelters:** capacity and occupancy management, validated contacts, map selection, place search and device location.
- **Inventory and supplies:** source stock, shelter requests, source suggestions, dispatch, partial receipt, returns, damage and usage records.
- **Disaster assistant:** Gemini-generated guidance and website help, with concise answers and server-side instructions.
- **Administration:** role-based access, account management, notifications and analytics.

## Documentation

| Document | Contents |
| --- | --- |
| [Architecture and technology](PROJECT_INFORMATION.md) | Components, tools, data model, techniques and design rationale |
| [System workflows](docs/WORKFLOWS.md) | Incident decisions, help offers, locations and stock-accounting rules |
| [API reference](docs/API.md) | Endpoint groups, access rules and request examples |
| [Validation and security](docs/SECURITY.md) | Implemented controls, privacy boundaries and remaining limitations |
| [Demonstration and verification](EVALUATOR_GUIDE.md) | Local setup, sample accounts, demonstration scenarios and tests |
| [Source guide](FUNCTION_INVENTORY.md) | Entry points for understanding and modifying each system |
| [UI review](UI_REVIEW.md) | Interface conventions and verified review scope |

## Technology

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Express 4 · MongoDB · Mongoose 8 · Zod · JWT · bcryptjs · Socket.IO · Leaflet · OpenStreetMap/Nominatim · Recharts · Google Gemini

Dependency versions are defined in the client/server manifests and pinned by their respective lockfiles. See the architecture document for each tool's purpose.

## Quick start

Requirements: Node.js 20.19 or later, npm, internet access, and a MongoDB replica set. Multi-document transactions will not work with a standalone MongoDB instance.

Install dependencies in separate terminals:

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

```powershell
cd client
npm ci
Copy-Item .env.example .env.local
```

Copy environment templates only on a fresh checkout; preserve existing environment files. Set `MONGODB_URI` and a strong `JWT_SECRET` in `server/.env`. Add `GEMINI_API_KEY` to enable the assistant. Never put that key in a `NEXT_PUBLIC_` variable.

Start the API and client in their respective terminals:

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). The API runs at `http://localhost:5000/api`; its health endpoint is `http://localhost:5000/health`. Restart the API after editing server environment settings.

For a demonstration without configuring MongoDB, use the [disposable preview](EVALUATOR_GUIDE.md#disposable-demonstration). Public registration creates citizen accounts; it cannot create administrators. The preview includes management accounts.

## Configuration

| Variable | Location | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Server | Replica-set database connection |
| `JWT_SECRET` | Server | Signing secret; required |
| `JWT_EXPIRES_IN` | Server | Token lifetime, default `7d` |
| `PORT` | Server | API port, default `5000` |
| `CLIENT_URL` | Server | Allowed browser origin, default `http://localhost:3000` |
| `GEMINI_API_KEY` | Server | Google AI Studio credential; optional until chat is used |
| `GEMINI_MODEL` | Server | Default `gemini-3.1-flash-lite` |
| `GEOCODER_URL` | Server | Optional Nominatim-compatible base URL |
| `NEXT_PUBLIC_API_URL` | Client | Browser API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Client | Socket.IO server URL |

Maps do not require an API key. Device location needs browser permission; internet access is required for map tiles, search and AI. Gemini availability and quotas depend on the Google account and selected model. Consult [Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) and the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).

## Verification

```powershell
# In server
npm test
npm run test:integration
npm run build

# In client
npm run build
```

The latest verification passed 44 unit tests, 25 integration tests and both production builds. Integration tests use disposable MongoDB replica sets. Live Gemini requests succeeded; one browser request timed out and correctly displayed retry feedback. This is a local demonstration, not a production-readiness certification.

## Repository layout

```text
client/src/app/          Routes and page layouts
client/src/components/   Shared interface and workflow components
client/src/lib/          API clients and frontend helpers
server/src/routes/      HTTP endpoints and access middleware
server/src/controllers/ Business operations
server/src/models/      MongoDB documents and indexes
server/src/utils/       Validation, policies and AI integration
server/src/socket/      Authenticated notifications and refresh events
server/tests/           Unit tests, integration tests and preview fixtures
docs/                   Workflow, API and security documentation
```

Environment files, dependencies and build output are excluded from Git. Existing assignment history is retained read-only; new help offers do not create assignments. Current behavior is described by the linked documentation rather than the previous prototype workflow.
