# Validation, Security and Operational Limits

This document describes implemented controls and known boundaries of the local demonstration. It is not a security certification or a claim that all vulnerabilities have been eliminated.

## Input handling

Validation is enforced by Zod at API boundaries and by Mongoose schemas and indexes at persistence boundaries. Browser checks provide immediate feedback but do not replace API validation.

| Input | Control |
| --- | --- |
| Names, descriptions, notes | Bounded strings; selected plain-text fields strip tags/control characters and are checked after normalization |
| Email | Trimmed, lowercased, validated format and bounded length |
| Registration password | At least 8 characters, uppercase/lowercase/digit/special character; at most 72 UTF-8 bytes for bcrypt; not trimmed |
| Coordinates | Numeric latitude/longitude with geographic bounds; paired values; blanks/null/booleans do not silently become zero |
| Shelter occupancy | Integer bounds and occupancy no greater than capacity |
| Contact details | Valid normalized mobile or email; mobile placeholder checks |
| Stock movement | Positive bounded integers, valid references and required explanations for applicable operations |
| Identifiers | ObjectId/UUID validation for applicable route/body references and retry keys |
| Image references | At most five HTTPS URLs without embedded credentials |
| Query parameters | Single string values, bounded lengths, valid parameter names; operator-shaped/nested query input rejected |
| Search patterns | User search text escaped before constructing regular expressions |
| AI input | Question at most 1,000 characters; at most six alternating history messages; strict object shape |

JSON requests are limited to 64 KB and URL-encoded bodies to 16 KB. Validation errors return controlled responses; malformed data and conflicts do not expose stack traces to clients. HTML stripping is normalization, not a general-purpose XSS sanitizer. React text rendering and appropriate escaping at map HTML boundaries remain necessary. Chat output is never injected as HTML.

## Access control

- Bearer JWTs are verified, then the active account and current role are read from MongoDB.
- Public registration cannot assign privileged roles.
- Management endpoints require authority/admin roles; account administration requires admin.
- Record-level ownership protects offers, private messages and notifications.
- Report visibility is enforced server-side, including pending/rejected reports and map data.
- Socket room identities come from server-validated account data, not client-provided room names.
- Role and active-state changes affect later API requests; an already-connected socket is not reauthenticated continuously.

## Data integrity

MongoDB transactions, optimistic concurrency, unique indexes and retry keys protect the implemented supply and coordination operations. Integration tests cover concurrent stock reservation, partial receipt, rollback and duplicate requests. Report resolution and offer/message writes coordinate through the incident document to avoid accepting work after closure. Historical records are not silently deleted or marked complete.

The stock ledger records supply movements; it is not an immutable, cryptographically verified audit system. Existing source quantity edits are not a full accounting adjustment ledger. Database backups, retention policy and disaster recovery are operational responsibilities outside this demonstration.

## AI and external services

The Gemini key stays in `server/.env`. Requests use Google's API-key header; the credential is never sent to the browser. Chat sends only user-entered conversation content and fixed system instructions, not database records. The assistant has no tools to modify the system. Provider diagnostics are not returned verbatim.

Limits are six requests per account per minute, one concurrent request per account, 60 requests per process per minute and four concurrent requests globally. This in-memory limiter is appropriate only for the current single-process local setup. It resets on restart and is not a shared distributed quota system. Provider limits apply independently.

Prompt instructions guide topic, brevity and safety, but cannot guarantee correctness or prevent every adversarial prompt. Incomplete or overlong responses fail explicitly. No canned disaster advice is substituted when Gemini is unavailable.

Map tiles are fetched by the browser. Place queries are sent through the server to Nominatim. Browser geolocation is permission-based. Provider availability, quotas and data policies apply; consult their official documentation before using real sensitive data.

## Remaining production work

The application deliberately retains prototype infrastructure. Before any real deployment, review and upgrade dependencies, add authentication abuse controls, evaluate HttpOnly-cookie/session design and token revocation, enforce HTTPS and deployment-specific security headers, implement shared rate limits, audit socket-session revocation, configure backups and index migrations, and perform independent authorization and penetration testing.

Tokens currently use browser localStorage, so an XSS vulnerability could expose them. Logout clears the client session rather than maintaining a token-revocation database. CORS is an origin policy, not an authorization mechanism. Format validation does not establish identity, professional qualification, contact ownership or the truth of a reported event.

## Repository hygiene

Do not commit `.env`, credentials, database exports, dependency folders or build output. Templates contain placeholders only. Preview passwords are public credentials for a disposable local fixture, not production credentials. Report a security issue privately to the repository owner without including live secrets in public issues.
