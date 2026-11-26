# Demonstration and Verification Guide

Updated: 26 November 2026. This guide demonstrates the current local application with sample data.

## Disposable demonstration

Install dependencies with `npm ci` in `server` and `client`. Copy the environment templates on a fresh checkout. Keep the client pointed at API port 5000. In the server directory, run:

```powershell
node tests/logistics-preview.cjs
```

The fixture starts a temporary MongoDB replica set and a real API on port 5000. It never connects to the application's configured database. The first run may download MongoDB binaries. Do not start the normal API on the same port.

In the client directory:

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000).

| Role | Email | Fixture password |
| --- | --- | --- |
| Management | `authority@example.test` | `Preview123!` |
| Administrator | `admin@example.test` | `Preview123!` |
| Citizen | `citizen@example.test` | `Preview123!` |

These accounts exist only in the disposable fixture. Type `stop` in its terminal to clean up; it also expires after 30 minutes. The fixture supports `PREVIEW_PORT` and `PREVIEW_CLIENT_URL` for isolated setups, but matching client API/socket URLs must be configured. For normal operation use `npm run dev` in server with a configured replica-set `MONGODB_URI`. Public registration creates only citizen accounts; management provisioning is an explicit administrative responsibility.

## Demonstration sequence

1. **Citizen reporting:** submit a realistic sample incident, choose a location and inspect the pending report. Explain why an unverified report is visible to its reporter and management but not to other community users.
2. **Management verification:** approve publication. Show the response status and its history separately from verification.
3. **Help offer:** sign in as a citizen, submit availability and contact details, then open My help offers. Show that management can contact the person immediately and no acceptance/start/completion sequence appears.
4. **Private coordination:** send a message from the participant and reply as management. Explain the participant-specific thread boundary.
5. **Incident resolution:** record resolution with a reason. Demonstrate that management does not need volunteer completion. Existing messages remain readable; new offers/messages are blocked. Reopen only with an explicit decision.
6. **Shelter location:** add a shelter using search, device location or map selection. Try an invalid contact and occupancy above capacity, then correct them. Show full/available status derived from occupancy.
7. **Source inventory:** create a warehouse location and a 500-bottle water lot. Explain physical quantity versus free availability and reservations.
8. **Supply delivery:** request 100 bottles for a shelter, choose matching stock and send. Receive 80 and record 20 damaged with a reason. Show the reopened shortage and movement history. Distribute 30 and confirm a remaining shelter balance of 50.
9. **Disaster assistant:** ask a preparedness or DRECS workflow question. Show a concise generated answer. It does not alter records or confirm current field conditions.
10. **Administration and analytics:** review accounts, summary charts and notifications. Counts summarize records; they do not prove responders arrived or conditions are safe.

Use separate browser profiles or sign out between roles. Do not share one browser's token across accounts manually.

## Automated verification

| Command | Purpose |
| --- | --- |
| Server `npm test` | Validation, policies, sockets, provider handling and unit-level workflow tests |
| Server `npm run test:integration` | Real transactions, concurrent requests, ownership and route access on disposable databases |
| Server `npm run build` | TypeScript compilation |
| Client `npm run build` | Production compilation and type checking |

Latest completed verification: **44 unit tests, 25 integration tests, both builds passed**. Relevant coverage includes:

- Numeric coordinate/contact boundaries, post-normalization validation, bounded inputs and safe query handling.
- Immediate help offers, duplicate-offer concurrency, owner updates and withdrawal.
- Resolution without offers or with unfinished historical records; controlled reopening and concurrent offer/resolution.
- Private-thread isolation, read-only closed conversations and message retries.
- Stock conservation, concurrent reservation, transaction rollback, partial receipts, returns, damage and idempotent demand.
- Source-location inheritance and shelter/storage coordinate synchronization.
- AI context shape, protected system instructions, output bounds, provider failures and process-local request limits.

Browser review confirmed the sign-in layout, management dashboard, assistant dialog, loading state and error/retry behavior. Direct live Gemini requests succeeded with `gemini-3.1-flash-lite`; one browser request timed out. Exhaustive multi-browser, screen-reader and end-to-end provider reliability testing has not been completed.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Transaction error on writes | Use a MongoDB replica set, not a standalone server |
| API connection failure | Confirm server port, client API URL and CORS `CLIENT_URL` |
| Management pages unavailable | Use a management fixture account; public registration creates citizens |
| Location permission denied | Use map selection or explicit place search |
| Place search throttled | Wait before another explicit search; do not add autocomplete to the public service |
| Assistant unavailable | Set server `GEMINI_API_KEY`, verify model access/quota and restart API |
| Assistant rejects response | Rephrase a narrower question; incomplete/overlong provider output is not displayed |
| Stock source not suggested | Match item/category/unit and ensure source location, active status and free stock |
| Changes do not appear | Check API errors and refresh; socket delivery is best effort |

For architecture and rationale, see [Project Information](PROJECT_INFORMATION.md). For accounting examples, see [Workflows](docs/WORKFLOWS.md). Security boundaries are in [Security](docs/SECURITY.md).
