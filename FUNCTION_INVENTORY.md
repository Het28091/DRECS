# Source Guide

This guide maps each implemented system to its principal entry points. It replaces the earlier generated line-number inventory, which no longer matched the redesigned workflows. Paths are stable references; anonymous callbacks and legacy helpers are not presented as separate product features.

| System | Client entry points | Server entry points |
| --- | --- | --- |
| Application shell | `components/layout/AppShell.tsx`, `Navbar.tsx`, `Sidebar.tsx` | — |
| Authentication | `context/AuthContext.tsx`, `components/layout/AuthGuard.tsx`, auth pages | `controllers/authController.ts`, `middleware/authMiddleware.ts`, `middleware/roleGuard.ts`, `utils/jwt.ts` |
| Incident reporting/list | `app/(main)/incidents/report/page.tsx`, `components/incidents/IncidentDashboard.tsx` | `controllers/incidentController.ts`, `utils/incidentPolicy.ts` |
| Incident detail/response | `components/incidents/IncidentDetail.tsx` | Incident status/review controllers and `routes/incidentRoutes.ts` |
| Help offers | `components/HelpOffers.tsx`, incident detail | `controllers/volunteerRequestController.ts`, `models/VolunteerRequest.ts` |
| Private coordination | `components/incidents/PrivateCoordination.tsx` | `routes/coordinationRoutes.ts`, `models/CoordinationMessage.ts` |
| Shelters | `app/(main)/shelters/page.tsx` | `controllers/shelterController.ts`, `models/Shelter.ts` |
| Location selection | `components/map/ShelterLocation.tsx`, `LocationPicker.tsx` | `routes/locationRoutes.ts` |
| Source inventory | `app/(main)/resources/page.tsx`, `components/StorageManager.tsx` | `controllers/resourceController.ts`, `models/Resource.ts` |
| Shelter supplies | `components/SupplyBoard.tsx`, `lib/logistics.ts` | `controllers/logisticsController.ts`, `utils/logisticsValidation.ts`, `models/Logistics.ts` |
| Disaster assistant | `components/DisasterChat.tsx` | `routes/chatbotRoutes.ts`, `utils/disasterAssistant.ts`, `config/env.ts` |
| Notifications | `components/layout/NotificationMenu.tsx`, notifications page | `controllers/notificationController.ts`, `socket/index.ts` |
| Analytics | `app/(main)/analytics/page.tsx` | `controllers/analyticsController.ts` |
| Administration | `app/(main)/admin/page.tsx` | `controllers/adminController.ts` |
| Input validation | Form feedback and `lib/phone.ts` | `utils/validators.ts`, `utils/phone.ts`, `middleware/queryGuard.ts` |
| Shared UI | `components/ui/`, `app/globals.css` | — |

Client paths are relative to `client/src`; server paths are relative to `server/src`.

## Reading order

Start with `server/src/index.ts` and `server/src/routes/index.ts` to understand middleware and mounted endpoints. Follow a route into its validator, controller and model. Then read the corresponding client component and API wrapper. The tests show expected failures and concurrency behavior as well as successful operations.

## Test map

| File in `server/tests` | Primary concern |
| --- | --- |
| `inputValidation.test.ts` | Input boundaries, contact information and place search |
| `workflows.test.ts` | Reports, access rules, notifications and analytics |
| `logistics.test.ts` | Matching, distance, transition and schema rules |
| `chatbot.test.ts` | Provider request structure, failure behavior, response limits and throttling |
| `offers.integration.ts` | Immediate offers, response decisions, private conversations and route access |
| `logistics.integration.ts` | Transactional stock accounting, retries, concurrency and location linkage |
| `logistics-preview.cjs` | Disposable real-API demonstration fixture |

## Compatibility code

`Assignment` records and read endpoints remain to preserve history. Old task mutation routes and the supply AI controller are removed. `AssistantQuota` and some older helper/schema names remain for compatibility; they do not describe the active chatbot or an approval queue. `ui-preview.cjs` is an older UI fixture; use `logistics-preview.cjs` for the current real-API demonstration.
