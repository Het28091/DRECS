# DRECS UI and interaction review

Review date: 5 October 2026. Perspective: project management, usability and frontend quality.

## Assessment

The core incident-to-response workflow is present. The main usability risks found in this pass were small controls with missing behaviour, mobile navigation taking over the content area, silent failures, and inconsistent dialog/keyboard behaviour. The fixes below improve these existing workflows. This is not a claim that every browser, role and real-database scenario has been exhaustively tested.

## Fixed findings

| Priority | Area | Finding and change |
| --- | --- | --- |
| P1 | Mobile shell | Fixed 240px sidebar squeezed all pages. Desktop keeps the sidebar; mobile now has a labelled navigation button and modal navigation. |
| P1 | Dialogs | Resource overlays lacked focus management, Escape support and small-screen scrolling. They now use the shared native dialog, explicit Tab wrapping, focus restoration, scroll locking, an accessible title and a close control. Closing is blocked during a save. |
| P1 | Failed loading | Resource, analytics, notification and user-list failures were console-only. Visible alerts and retry controls now explain failure. Empty resource/notification/user lists are suppressed after a failed initial load. |
| P2 | Passwords | Login and registration now have labelled show/hide toggles, preserved input values, password-manager autocomplete, and submission guards. Toggle buttons cannot submit the form. |
| P2 | Registration | Password requirements are visible before typing, rather than hiding the reason the submit button is disabled. Each rule has a screen-reader-readable met/not-met state. Name length and autocomplete match the API. Registration has its own page title. |
| P2 | Authentication errors | Editing credentials clears obsolete error feedback; server field errors clear for the edited registration field. Alerts are announced. |
| P2 | Resource edit | Replaced the misleading stock-status override with Automatic from stock / Maintenance. The former LOW_STOCK and DEPLETED choices were overwritten by server calculations. |
| P2 | Resource forms | Connected labels to controls, named filters and icon-only edit/delete buttons, cleared old modal errors on reopening, and added mutation guards. Allocation is disabled when no approved active incident is available, with an explanation. |
| P2 | Resource actions | Failed release/delete actions now show an error. Repeated resource mutations are disabled while a request is running. |
| P2 | Notifications | Added keyboard-accessible Mark read buttons in place of mouse-only clickable cards; prevented overlapping mark operations; related-record links also mark the notification read. Notification links are restricted to local paths. |
| P2 | Notification popup | Positioned the popup against the mobile viewport so it cannot extend off the left edge beside the header controls. |
| P2 | Map refresh | Automatic refresh updates markers without recentering a map the user is exploring. Explicit refresh/center actions still fit markers. |
| P2 | Map contrast | Popup text had dark inline colors on a dark background. Updated to readable light text. |
| P2 | Map selection | Added Use map center and keyboard instructions so selecting a location does not require a mouse click. Leaflet arrow-key panning remains available. |
| P2 | Stale validation | Incident title/description and offer-help errors clear when the corresponding field is edited; submission still validates all fields. Incident fields expose invalid/error associations. |
| P2 | Recovery after refresh | Dashboard, map, request and task fetches clear stale errors after a successful recovery. |
| P2 | Navigation semantics | Removed nested link/button controls in Dashboard and Volunteer Force, identified the active navigation link, and added Skip to content. |
| P2 | Shared buttons | Default to type=button to avoid accidental form submission, and announce loading with aria-busy. Actual submit buttons retain explicit type=submit. |
| P2 | Keyboard/motion | Added consistent visible focus outlines and reduced-motion styling. |
| P3 | Copy/layout | Simplified analytics description, improved mobile auth padding and long-name truncation, and retained clear labels instead of icon-only actions. |

P1 means a task can be blocked or misleading; P2 is a significant interaction/accessibility issue; P3 is polish.

## Screen coverage

Source review covered login, registration, the shared shell/header/sidebar, Dashboard and incident cards, incident details and offer-help, report form and location picker, map/popups, shelters, resources, volunteer requests, Volunteer Force, assigned tasks, notifications, analytics, and admin. The `/incidents` and `/incidents/my` pages are redirects. Shared buttons, cards and dialogs were also inspected.

Browser verification uses `server/tests/ui-preview.cjs`, an isolated in-memory fixture with no connection to the real database. Login/show/hide, registration/show/hide and rule visibility, mobile Dashboard width (390px), mobile authority navigation, resource load-failure messaging, resource dialog labels and Escape/focus behaviour are the targeted checks. The fixture intentionally does not implement resource persistence, analytics or admin endpoints; those failures test the error UI, not live service availability.

Production compilation includes all application pages, TypeScript and Next.js lint checks. Existing backend tests cover the previously implemented workflow rules. Browser geolocation permissions, actual account creation, screen-reader output, real inventory writes and cross-device synchronization still require an integration environment.

## Remaining work and dependencies

1. **P1 release gate: role-based integration walkthrough.** Use a seeded test MongoDB replica set with citizen, authority, volunteer-capable citizen and admin accounts. Verify review, assignment, stock, notification and concurrent-update flows in two browser sessions. This cannot be established by in-memory fixtures alone.
2. **P2 request ordering.** Rapid filter changes and overlapping live refreshes should eventually use cancellation/request sequence guards consistently across list pages. Test delayed and out-of-order responses before declaring filter behaviour fully hardened.
3. **P2 accessibility coverage.** Run a full screen-reader and keyboard review, including Leaflet controls, chart data alternatives, long translated content and 200% zoom. This pass improves known issues but is not a WCAG conformance audit.
4. **P2 account recovery.** A real Forgot password flow requires server token expiry, one-time use, an email delivery service, rate limits and abuse tests. Do not add a decorative link without a working recovery flow.
5. **P2 destructive-action consistency.** Existing browser confirmations remain for deletes and sensitive role changes. A future shared confirmation dialog can add affected-record details and consistent language; retaining a confirmation is preferable to removing it for visual polish.
6. **P3 analytics clarity.** Add explicit chart empty states and accessible data tables. Mixed inventory units should not be presented as a meaningful single supply total; use per-unit breakdowns when extending analytics.

The shelter-demand/stock-transfer design and later AI assistant remain separate product work described in [Project Information](PROJECT_INFORMATION.md). Finish the integration and inventory foundations before adding AI recommendations.
