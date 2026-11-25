# DRECS source function inventory

Generated from the TypeScript syntax tree on 8 October 2026. This lists named functions, named arrow-function variables, and controller wrappers in client/src and server/src. Anonymous render/event callbacks are implementation details of the listed parent function. Presence in source does not imply a routed feature; see EVALUATOR_GUIDE.md for active versus legacy paths. The Calls column lists direct calls in the function body to help trace its working; it is not proof of test coverage.

## client/src/app/(auth)/layout.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AuthLayout` | 8 |  |

## client/src/app/(auth)/login/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `LoginPage` | 11 | `useRouter`, `useAuth`, `useState`, `useEffect`, `router.push`, `e.preventDefault`, `setError`, `email.trim`, `setIsSubmitting`, `login`, `setEmail`, `setPassword` |
| `handleSubmit` | 26 | `e.preventDefault`, `setError`, `email.trim`, `setIsSubmitting`, `login`, `router.push` |

## client/src/app/(auth)/register/layout.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `RegisterLayout` | 3 |  |

## client/src/app/(auth)/register/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `RegisterPage` | 11 | `useRouter`, `useAuth`, `useState`, `useEffect`, `router.push`, `/[A-Z]/.test`, `/[a-z]/.test`, `/[0-9]/.test`, `/[!@#$%^&*()_+\-=[\]{};':"\\\|,.<>/?]/.test`, `rules.every`, `e.preventDefault`, `setError`, `setFieldErrors`, `name.trim` |
| `handleSubmit` | 39 | `e.preventDefault`, `setError`, `setFieldErrors`, `name.trim`, `email.trim`, `setIsSubmitting`, `register`, `router.push` |

## client/src/app/(main)/admin/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AdminPage` | 15 | `useRouter`, `useAuth`, `useState`, `useRef`, `useEffect`, `router.replace`, `useCallback`, `setLoading`, `getAllUsers`, `setUsers`, `setLoadError`, `getAdminOverview`, `setSystemStats`, `setOverviewError` |
| `handleRoleChange` | 77 | `confirm`, `setActionLoading`, `updateUserRole`, `fetchUsers`, `fetchOverview`, `setLoadError` |
| `handleStatusToggle` | 91 | `confirm`, `setActionLoading`, `toggleUserStatus`, `fetchUsers`, `fetchOverview`, `setLoadError` |

## client/src/app/(main)/analytics/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ChartValues` | 34 | `rows.map` |
| `AnalyticsPage` | 38 | `useRouter`, `useAuth`, `useState`, `useEffect`, `router.replace`, `useCallback`, `setLoading`, `Promise.all`, `getOverviewStats`, `getIncidentTrends`, `getVolunteerActivity`, `getResourceUtilization`, `setOverview`, `setLoadError` |

## client/src/app/(main)/incidents/[id]/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `volunteerName` | 49 |  |
| `requesterName` | 56 |  |
| `requesterEmail` | 63 |  |
| `RequestStatusPill` | 70 | `status.replace` |
| `IncidentDetailPage` | 85 | `useParams`, `useRouter`, `useAuth`, `useState`, `useCallback`, `setIsLoading`, `setError`, `fetchIncidentById`, `setIncident`, `setStatusDraft`, `(data.allowedTransitions ?? []).includes`, `fetchIncidentAssignments`, `setAssignments`, `fetchIncidentVolunteerRequests` |
| `handleIncidentReview` | 248 | `setIsUpdating`, `setError`, `reviewIncident`, `setIncident`, `setStatusDraft` |
| `handleStatusUpdate` | 259 | `setIsUpdating`, `setUpdateMessage`, `setError`, `updateIncidentStatus`, `setIncident`, `setStatusDraft` |
| `handleSubmitRequest` | 282 | `skills.split(',').map(s => s.trim()).filter`, `skills.split(',').map`, `skills.split`, `s.trim`, `parsedSkills.some`, `experience.trim`, `message.trim`, `isValidMobile`, `phoneNumber.trim`, `setOfferErrors`, `Object.keys`, `setIsSubmittingRequest`, `setRequestMessage`, `setError` |
| `handleReview` | 327 | `setReviewingId`, `setError`, `reviewVolunteerRequest`, `setVolunteerRequests`, `prev.map`, `fetchIncidentAssignments`, `setAssignments`, `fetchIncidentById`, `setIncident`, `setStatusDraft` |
| `reporterLabel` | 355 |  |
| `reporterEmail` | 363 |  |

## client/src/app/(main)/incidents/my/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `MyIncidentsPage` | 2 | `redirect` |

## client/src/app/(main)/incidents/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `IncidentsPage` | 2 | `redirect` |

## client/src/app/(main)/incidents/report/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ReportIncidentPage` | 21 | `useRouter`, `useState`, `useEffect`, `Number.isFinite`, `Number`, `Math.abs`, `address.trim`, `setFieldErrors`, `Object.keys`, `setError`, `setIsLocating`, `setLocSuccessMsg`, `navigator.geolocation.getCurrentPosition`, `position.coords.latitude.toFixed` |
| `handleDetectLocation` | 53 | `setIsLocating`, `setLocSuccessMsg`, `navigator.geolocation.getCurrentPosition`, `position.coords.latitude.toFixed`, `position.coords.longitude.toFixed`, `setLatitude`, `setLongitude` |
| `handleSubmit` | 75 | `e.preventDefault`, `setError`, `setFieldErrors`, `title.trim`, `description.trim`, `address.trim`, `Number`, `addError`, `cleanTitle.toLowerCase`, `cleanDesc.toLowerCase`, `Number.isNaN`, `Object.keys`, `setIsSubmitting`, `createIncident` |
| `addError` | 89 |  |

## client/src/app/(main)/layout.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `MainLayout` | 16 |  |

## client/src/app/(main)/map/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `MapPage` | 41 | `useState`, `useCallback`, `setIsLoading`, `setError`, `Promise.all`, `fetchMapIncidents`, `fetchShelters`, `setIncidents`, `setShelters`, `setFitToken`, `useLiveRefresh`, `load`, `useEffect`, `SEVERITY_LEGEND.map` |

## client/src/app/(main)/notifications/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `NotificationsPage` | 16 | `useAuth`, `useState`, `useRef`, `useCallback`, `setLoading`, `getMyNotifications`, `setNotifications`, `setLoadError`, `setUnreadCount`, `useLiveRefresh`, `fetchNotifications`, `Boolean`, `useEffect`, `getSocket` |
| `handleNewNotification` | 46 | `fetchNotifications` |
| `handleMarkAsRead` | 57 | `setMarking`, `markNotificationAsRead`, `setNotifications`, `prev.map`, `fetchNotifications`, `setLoadError` |
| `handleMarkAllRead` | 71 | `setMarking`, `markAllNotificationsAsRead`, `setNotifications`, `prev.map`, `setUnreadCount`, `setLoadError` |
| `getNotificationIcon` | 83 |  |

## client/src/app/(main)/resources/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ResourcesPage` | 17 | `useAuth`, `useState`, `useCallback`, `setLoading`, `getAllResources`, `setResources`, `setLoadError`, `getAllIncidents`, `setIncidents`, `data.incidents.filter(i => i.approvalStatus === 'APPROVED' && ['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).map`, `data.incidents.filter`, `['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes`, `useLiveRefresh`, `fetchResources` |
| `handleCreateSubmit` | 87 | `e.preventDefault`, `setSubmitting`, `setErrorMsg`, `createResource`, `Number`, `setShowCreateModal`, `setFormData`, `fetchResources`, `Object.values(err.response?.data?.errors \|\| {}).flat().join`, `Object.values(err.response?.data?.errors \|\| {}).flat`, `Object.values` |
| `handleAllocateSubmit` | 110 | `e.preventDefault`, `setSubmitting`, `setErrorMsg`, `allocateResource`, `Number`, `setShowAllocateModal`, `setAllocateData`, `fetchResources`, `Object.values(err.response?.data?.errors \|\| {}).flat().join`, `Object.values(err.response?.data?.errors \|\| {}).flat`, `Object.values` |
| `handleEditSubmit` | 131 | `e.preventDefault`, `setSubmitting`, `setErrorMsg`, `updateResource`, `Number`, `setShowEditModal`, `fetchResources`, `Object.values(err.response?.data?.errors \|\| {}).flat().join`, `Object.values(err.response?.data?.errors \|\| {}).flat`, `Object.values` |
| `handleRelease` | 153 | `setActionError`, `confirm`, `setSubmitting`, `releaseResource`, `fetchResources` |
| `handleDelete` | 166 | `confirm`, `setSubmitting`, `deleteResource`, `fetchResources`, `setActionError` |
| `getStatusBadge` | 177 |  |

## client/src/app/(main)/shelters/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `statusVariant` | 34 |  |
| `occupancyPercent` | 42 | `Math.min`, `Math.floor` |
| `SheltersPage` | 47 | `useAuth`, `useState`, `useRef`, `useCallback`, `setIsLoading`, `setLoadError`, `fetchShelters`, `setShelters`, `useLiveRefresh`, `load`, `Boolean`, `useEffect`, `setName`, `setAddress` |
| `resetForm` | 93 | `setName`, `setAddress`, `setLatitude`, `setLongitude`, `setCapacity`, `setOccupancy`, `setFacilities`, `setContactInfo`, `setStatus`, `setEditingId`, `setShowForm` |
| `startEdit` | 107 | `setError`, `setEditingId`, `setShowForm`, `setName`, `setAddress`, `setLatitude`, `String`, `setLongitude`, `setCapacity`, `setOccupancy`, `setFacilities`, `shelter.facilities.join`, `setContactInfo`, `setStatus` |
| `handleSubmit` | 123 | `e.preventDefault`, `setError`, `Number`, `name.trim`, `contactInfo.trim`, `Number.isNaN`, `address.trim`, `facilities .split(',') .map((f) => f.trim()) .filter`, `facilities .split(',') .map`, `facilities .split`, `f.trim`, `setIsSaving`, `updateShelter`, `setShelters` |
| `handleDelete` | 187 | `window.confirm`, `setIsSaving`, `setError`, `deleteShelter`, `setShelters`, `prev.filter`, `resetForm` |

## client/src/app/(main)/supplies/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Field` | 19 |  |
| `errorMessage` | 24 | `Object.values(e.response?.data?.errors \|\| {}).flat().join`, `Object.values(e.response?.data?.errors \|\| {}).flat`, `Object.values` |
| `SuppliesPage` | 25 | `useAuth`, `useRouter`, `useState`, `useRef`, `useCallback`, `Promise.all`, `getLogistics`, `getAllResources`, `fetchShelters`, `getAssistantStatus`, `setData`, `setResources`, `setShelters`, `setConfigured` |
| `shelterName` | 47 | `shelters.find` |
| `resourceName` | 48 | `resources.find` |
| `act` | 51 | `setBusy`, `setError`, `setSuccess`, `work`, `setConfirmation`, `setSuggestions`, `load`, `errorMessage` |
| `confirm` | 56 | `setError`, `setNote`, `setQuantity`, `setConfirmation` |
| `showSuggestions` | 57 | `setBusy`, `setError`, `setSuggestions`, `getSuggestions`, `errorMessage` |
| `submitStorage` | 58 | `e.preventDefault`, `shelters.find`, `setError`, `act`, `postLogistics`, `setStorage`, `setPoint` |
| `sendQuestion` | 63 | `e.preventDefault`, `setBusy`, `setError`, `setAnswer`, `askAssistant`, `errorMessage` |

## client/src/app/(main)/volunteer-requests/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `requesterName` | 21 |  |
| `requesterEmail` | 28 |  |
| `incidentTitle` | 35 |  |
| `incidentId` | 42 |  |
| `StatusPill` | 49 | `status.replace` |
| `VolunteerRequestsPage` | 64 | `useRouter`, `useAuth`, `useState`, `useEffect`, `router.replace`, `useCallback`, `setIsLoading`, `setError`, `fetchAllVolunteerRequests`, `setRequests`, `useLiveRefresh`, `load`, `setReviewingId`, `reviewVolunteerRequest` |
| `handleReview` | 110 | `setReviewingId`, `setError`, `reviewVolunteerRequest`, `load` |

## client/src/app/(main)/volunteers/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `VolunteersPage` | 16 | `useRouter`, `useAuth`, `useState`, `fetchVolunteers`, `setVolunteers`, `setError`, `setIsLoading`, `useLiveRefresh`, `load`, `useEffect`, `router.replace`, `window.confirm`, `setRemovingId`, `removeAssignment` |
| `load` | 26 | `fetchVolunteers`, `setVolunteers`, `setError`, `setIsLoading` |
| `handleRemoveAssignment` | 55 | `window.confirm`, `setRemovingId`, `setError`, `removeAssignment`, `load` |

## client/src/app/(main)/volunteers/tasks/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getIncident` | 22 |  |
| `VolunteerTasksPage` | 37 | `useRouter`, `useAuth`, `useState`, `useEffect`, `router.replace`, `useCallback`, `setIsLoading`, `setError`, `fetchMyAssignments`, `setAssignments`, `useLiveRefresh`, `load`, `Boolean`, `setUpdatingId` |
| `handleAction` | 82 | `setUpdatingId`, `setError`, `updateAssignmentStatus`, `setAssignments`, `prev.map` |

## client/src/app/layout.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `RootLayout` | 19 |  |

## client/src/app/page.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `RootPage` | 7 | `redirect` |

## client/src/app/providers.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Providers` | 12 |  |

## client/src/components/incidents/IncidentBadges.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `StatusBadge` | 26 | `status.replace` |
| `SeverityBadge` | 34 |  |

## client/src/components/incidents/IncidentDashboard.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `isAuthorityRole` | 27 |  |
| `getUserId` | 30 |  |
| `IncidentCard` | 33 | `reporterName`, `formatDate`, `incident.location.latitude.toFixed`, `incident.location.longitude.toFixed` |
| `reporterName` | 34 |  |
| `IncidentsPage` | 73 | `useAuth`, `useState`, `isAuthorityRole`, `useCallback`, `setIsLoading`, `setError`, `fetchAllIncidents`, `setAuthorityIncidents`, `data.filter`, `setMyIncidents`, `setOtherIncidents`, `Promise.all`, `fetchMyIncidents`, `fetchPublicIncidents` |

## client/src/components/incidents/StatusTimeline.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `actorLabel` | 11 |  |
| `StatusTimeline` | 17 | `[...history].sort`, `new Date(a.changedAt).getTime`, `new Date(b.changedAt).getTime`, `entries.map`, `actorLabel`, `formatDate` |

## client/src/components/layout/AppShell.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AppShell` | 5 | `useState`, `setMenuOpen` |

## client/src/components/layout/AuthGuard.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AuthGuard` | 11 | `useRouter`, `useAuth`, `useEffect`, `router.replace` |

## client/src/components/layout/Footer.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Footer` | 1 | `new Date().getFullYear` |

## client/src/components/layout/Navbar.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Navbar` | 12 | `useRouter`, `useAuth`, `logout`, `router.push` |
| `handleLogout` | 18 | `logout`, `router.push` |

## client/src/components/layout/NotificationMenu.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `NotificationMenu` | 11 | `useAuth`, `useSocket`, `useState`, `useRef`, `getMyNotifications`, `setItems`, `setUnread`, `setError`, `useLiveRefresh`, `Boolean`, `useEffect`, `setToasts`, `setOpen`, `load` |
| `load` | 21 | `getMyNotifications`, `setItems`, `setUnread`, `setError` |
| `receive` | 34 | `setItems`, `current.filter`, `load`, `setToasts`, `[item, ...current.filter(n => n.id !== item.id)].slice`, `clearTimeout`, `timers.current.get`, `timers.current.set`, `setTimeout`, `timers.current.delete` |
| `outside` | 51 | `container.current?.contains`, `setOpen` |
| `escape` | 52 | `setOpen` |
| `read` | 57 | `setOpen`, `setToasts`, `current.filter`, `markNotificationAsRead`, `load`, `setError` |
| `href` | 64 | `item.link?.startsWith`, `item.link.startsWith` |

## client/src/components/layout/Sidebar.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Sidebar` | 82 | `usePathname`, `useAuth`, `useVolunteerCapability`, `CITIZEN_ROLES.includes`, `navItems.findIndex`, `navItems.splice`, `navItems.map`, `navItems.some`, `pathname.startsWith`, `cn` |

## client/src/components/map/IncidentMarker.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `IncidentMarker` | 12 | `Number.isNaN`, `createSeverityIcon`, `incident.status.replace` |

## client/src/components/map/LocationPicker.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `LocationPicker` | 6 | `useRef`, `useEffect`, `L.map(container.current).setView`, `L.map`, `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19, }).addTo`, `L.tileLayer`, `instance.on`, `callback.current`, `event.latlng.wrap`, `instance.remove`, `marker.current?.remove`, `marker.current.setLatLng`, `L.circleMarker(value, { radius: 10, color: '#fff', fillColor: '#f97316', fillOpacity: 1 }).addTo`, `L.circleMarker` |

## client/src/components/map/MapContainer.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `clearLeafletContainer` | 23 |  |
| `isValidPoint` | 31 | `Number.isNaN` |
| `MapContainer` | 45 | `useRef`, `useEffect`, `mapRef.current.remove`, `clearLeafletContainer`, `L.map(el, { scrollWheelZoom: true, zoomControl: true, }).setView`, `L.map`, `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', }).addTo`, `L.tileLayer`, `L.layerGroup().addTo`, `L.layerGroup`, `map.invalidateSize`, `requestAnimationFrame`, `window.setTimeout`, `window.clearTimeout` |
| `invalidate` | 81 | `map.invalidateSize` |
| `escapeHtml` | 197 | `value .replace(/&/g, '&amp;') .replace(/</g, '&lt;') .replace(/>/g, '&gt;') .replace(/"/g, '&quot;') .replace`, `value .replace(/&/g, '&amp;') .replace(/</g, '&lt;') .replace(/>/g, '&gt;') .replace`, `value .replace(/&/g, '&amp;') .replace(/</g, '&lt;') .replace`, `value .replace(/&/g, '&amp;') .replace`, `value .replace` |

## client/src/components/map/ShelterMarker.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ShelterMarker` | 11 | `Number.isNaN`, `createShelterIcon` |

## client/src/components/map/mapUtils.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `createSeverityIcon` | 16 | `require`, `L.divIcon` |
| `createShelterIcon` | 40 | `require`, `L.divIcon` |

## client/src/components/ui/Badge.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Badge` | 21 | `cn` |

## client/src/components/ui/Button.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Button` | 33 | `cn` |

## client/src/components/ui/Card.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Card` | 9 | `cn` |
| `CardHeader` | 23 | `cn` |
| `CardTitle` | 31 | `cn` |
| `CardContent` | 39 | `cn` |
| `CardFooter` | 45 | `cn` |

## client/src/components/ui/ErrorNotice.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ErrorNotice` | 2 |  |

## client/src/components/ui/Modal.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `Modal` | 7 | `useRef`, `useId`, `useEffect`, `element?.showModal`, `element?.close`, `previous.focus`, `Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter`, `Array.from`, `event.currentTarget.querySelectorAll`, `element.getClientRects`, `event.preventDefault`, `last.focus`, `first.focus`, `onClose` |

## client/src/components/ui/PasswordInput.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `PasswordInput` | 5 | `useState`, `setVisible` |

## client/src/components/volunteers/AssignmentStatusBadge.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AssignmentStatusBadge` | 14 | `status.replace` |

## client/src/context/AuthContext.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `AuthProvider` | 29 | `useState`, `useCallback`, `setToken`, `setUser`, `localStorage.removeItem`, `console.log`, `api.get`, `localStorage.setItem`, `JSON.stringify`, `console.error`, `logout`, `setIsLoading`, `useEffect`, `localStorage.getItem` |
| `initializeAuth` | 67 | `localStorage.getItem`, `setToken`, `setUser`, `JSON.parse`, `console.error`, `fetchCurrentUser`, `setIsLoading` |
| `login` | 93 | `setIsLoading`, `api.post`, `setToken`, `setUser`, `localStorage.setItem`, `JSON.stringify`, `console.log`, `console.error` |
| `register` | 118 | `setIsLoading`, `api.post`, `setToken`, `setUser`, `localStorage.setItem`, `JSON.stringify` |

## client/src/context/SocketContext.tsx

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `SocketProvider` | 7 | `useAuth`, `useState`, `useEffect`, `getSocket`, `setIsConnected`, `instance.on`, `setSocket`, `instance.connect`, `instance.off`, `instance.disconnect` |
| `connected` | 15 | `setIsConnected` |
| `disconnected` | 16 | `setIsConnected` |

## client/src/hooks/useAuth.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `useAuth` | 4 | `useContext` |

## client/src/hooks/useFetch.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `useFetch` | 8 | `useState`, `useCallback`, `setLoading`, `setError`, `api.get`, `setData`, `useEffect`, `fetchData` |

## client/src/hooks/useLiveRefresh.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `useLiveRefresh` | 6 | `useSocket`, `useRef`, `useEffect`, `latest.current`, `schedule`, `clearTimeout`, `setTimeout`, `socket?.on`, `window.addEventListener`, `document.addEventListener`, `setInterval`, `clearInterval`, `socket?.off`, `window.removeEventListener` |
| `run` | 16 | `latest.current`, `schedule` |
| `schedule` | 23 | `clearTimeout`, `setTimeout` |

## client/src/hooks/useSocket.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `useSocket` | 4 | `useContext` |

## client/src/hooks/useVolunteerCapability.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `useVolunteerCapability` | 16 | `useAuth`, `useState`, `useEffect`, `setHasVolunteerCapability`, `setActiveAssignmentCount`, `setIsLoading`, `fetchMyVolunteerAccess`, `load`, `setInterval`, `getSocket`, `socket.on`, `clearInterval`, `socket.off` |
| `load` | 25 | `setHasVolunteerCapability`, `setActiveAssignmentCount`, `setIsLoading`, `fetchMyVolunteerAccess` |

## client/src/lib/admin.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getAllUsers` | 4 | `api.get` |
| `updateUserRole` | 9 | `api.patch` |
| `toggleUserStatus` | 17 | `api.patch` |
| `getAdminOverview` | 25 | `api.get` |

## client/src/lib/analytics.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getOverviewStats` | 4 | `api.get` |
| `getIncidentTrends` | 9 | `api.get` |
| `getVolunteerActivity` | 19 | `api.get` |
| `getResourceUtilization` | 28 | `api.get` |

## client/src/lib/assignments.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `fetchMyAssignments` | 12 | `api.get` |
| `fetchMyVolunteerAccess` | 17 | `api.get` |
| `fetchIncidentAssignments` | 22 | `api.get` |
| `updateAssignmentStatus` | 29 | `api.patch` |
| `fetchVolunteers` | 39 | `api.get` |
| `removeAssignment` | 44 | `api.delete` |

## client/src/lib/incidents.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `createIncident` | 10 | `api.post` |
| `fetchMyIncidents` | 15 | `api.get` |
| `fetchAllIncidents` | 20 | `api.get` |
| `getAllIncidents` | 31 | `api.get` |
| `fetchPublicIncidents` | 42 | `api.get` |
| `fetchIncidentById` | 53 | `api.get` |
| `updateIncidentStatus` | 58 | `api.patch` |
| `reviewIncident` | 68 | `api.patch` |

## client/src/lib/logistics.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getLogistics` | 10 | `api.get` |
| `getSuggestions` | 11 | `api.get` |
| `postLogistics` | 12 | `api.post` |
| `changeTransfer` | 13 | `api.patch` |
| `getAssistantStatus` | 14 | `api.get` |
| `askAssistant` | 15 | `api.post` |

## client/src/lib/map.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `fetchMapIncidents` | 4 | `api.get` |

## client/src/lib/notifications.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getMyNotifications` | 4 | `api.get` |
| `markNotificationAsRead` | 9 | `api.patch` |
| `markAllNotificationsAsRead` | 16 | `api.patch` |

## client/src/lib/phone.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `isValidMobile` | 2 | `/^[6-9]\d{9}$/.test`, `/^(\d)\1{9}$/.test`, `/^(\d{2})\1{4}$/.test`, `/^(\d{5})\1$/.test`, `['01234567890123456789', '98765432109876543210'].some`, `sequence.includes` |

## client/src/lib/resources.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getAllResources` | 4 | `api.get` |
| `getResourceById` | 9 | `api.get` |
| `createResource` | 14 | `api.post` |
| `updateResource` | 26 | `api.patch` |
| `deleteResource` | 31 | `api.delete` |
| `allocateResource` | 36 | `api.post` |
| `releaseResource` | 41 | `api.post` |

## client/src/lib/shelters.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `fetchShelters` | 10 | `api.get` |
| `fetchShelterById` | 17 | `api.get` |
| `createShelter` | 22 | `api.post` |
| `updateShelter` | 27 | `api.patch` |
| `deleteShelter` | 35 | `api.delete` |

## client/src/lib/socket.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getSocket` | 6 | `io` |

## client/src/lib/utils.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `cn` | 3 | `clsx` |
| `formatDate` | 7 | `new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', }).format` |

## client/src/lib/volunteerRequests.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `createVolunteerRequest` | 10 | `api.post` |
| `fetchIncidentVolunteerRequests` | 21 | `api.get` |
| `fetchAllVolunteerRequests` | 30 | `api.get` |
| `fetchMyVolunteerRequests` | 39 | `api.get` |
| `reviewVolunteerRequest` | 48 | `api.patch` |

## server/src/config/db.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `connectDB` | 4 | `mongoose.set`, `mongoose.connect`, `console.log`, `console.error`, `process.exit` |
| `disconnectDB` | 16 | `mongoose.disconnect`, `console.log` |

## server/src/controllers/adminController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getAllUsers` | 19 | `req.query.search.trim`, `User.find(filter) .select('name email role isActive createdAt updatedAt') .sort`, `User.find(filter) .select`, `User.find`, `res.status(200).json`, `res.status`, `users.map`, `u._id.toString` |
| `updateUserRole` | 57 | `Types.ObjectId.isValid`, `createError`, `validRoles.includes`, `User.findById`, `user.save`, `dispatchNotification`, `user._id.toString`, `res.status(200).json`, `res.status` |
| `toggleUserStatus` | 110 | `Types.ObjectId.isValid`, `createError`, `User.findById`, `user.save`, `dispatchNotification`, `user._id.toString`, `res.status(200).json`, `res.status` |
| `getAdminOverview` | 161 | `Promise.all`, `User.countDocuments`, `Incident.countDocuments`, `Shelter.countDocuments`, `Resource.countDocuments`, `res.status(200).json`, `res.status` |

## server/src/controllers/analyticsController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getOverviewStats` | 16 | `Promise.all`, `Incident.countDocuments`, `Shelter.countDocuments`, `Shelter.aggregate`, `Resource.countDocuments`, `Resource.aggregate`, `User.countDocuments`, `Assignment.countDocuments`, `Math.floor`, `res.status(200).json`, `res.status` |
| `getIncidentTrends` | 93 | `Promise.all`, `Incident.aggregate`, `res.status(200).json`, `res.status`, `byStatus.map`, `byCategory.map`, `bySeverity.map` |
| `getVolunteerActivity` | 123 | `Promise.all`, `VolunteerRequest.aggregate`, `Assignment.aggregate`, `res.status(200).json`, `res.status`, `requestsByStatus.map`, `assignmentsByStatus.map` |
| `getResourceUtilization` | 145 | `Promise.all`, `Resource.aggregate`, `res.status(200).json`, `res.status`, `byCategory.map`, `byStatus.map` |

## server/src/controllers/assignmentController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatUser` | 13 | `ref._id.toString`, `String` |
| `formatIncidentSummary` | 34 | `ref._id.toString`, `String` |
| `formatAssignment` | 64 | `assignment._id.toString`, `formatIncidentSummary`, `formatUser` |
| `populateAssignment` | 76 | `assignment.populate` |
| `assignVolunteerToIncident` | 92 | `createError`, `Types.ObjectId.isValid`, `Incident.findById`, `canOfferHelp`, `User.findById`, `Assignment.findOne`, `Assignment.create`, `incident.statusHistory.push`, `incident.save`, `dispatchNotification`, `populateAssignment`, `res.status(201).json`, `res.status`, `formatAssignment` |
| `getAssignmentsByIncident` | 162 | `Types.ObjectId.isValid`, `createError`, `Incident.findById(incidentId).select`, `Incident.findById`, `Assignment.find({ incidentId }) .sort({ assignedAt: -1 }) .populate('volunteerId', 'name email role') .populate`, `Assignment.find({ incidentId }) .sort({ assignedAt: -1 }) .populate`, `Assignment.find({ incidentId }) .sort`, `Assignment.find`, `res.status(200).json`, `res.status`, `assignments.map` |
| `getMyAssignments` | 193 | `createError`, `Assignment.find({ volunteerId: req.user.id }) .sort({ assignedAt: -1 }) .populate('volunteerId', 'name email role') .populate`, `Assignment.find({ volunteerId: req.user.id }) .sort({ assignedAt: -1 }) .populate`, `Assignment.find({ volunteerId: req.user.id }) .sort`, `Assignment.find`, `res.status(200).json`, `res.status`, `assignments.filter`, `assignments.filter(a => a.incidentId).map` |
| `getMyVolunteerAccess` | 217 | `createError`, `Assignment.countDocuments`, `res.status(200).json`, `res.status` |
| `updateAssignmentStatus` | 247 | `createError`, `ASSIGNMENT_STATUSES.includes`, `Types.ObjectId.isValid`, `Assignment.findById`, `assignment.volunteerId.toString`, `Incident.findById`, `canOfferHelp`, `allowedNext.includes`, `assignment.save`, `Incident.findOneAndUpdate`, `populateAssignment`, `dispatchNotificationToRoles`, `status.replace`, `res.status(200).json` |
| `removeAssignment` | 344 | `createError`, `Types.ObjectId.isValid`, `Assignment.db.transaction`, `Assignment.findById(req.params.id).session`, `Assignment.findById`, `Incident.findById(assignment.incidentId).session`, `Incident.findById`, `assignment.deleteOne`, `VolunteerRequest.updateOne`, `Assignment.exists({ incidentId: incident._id, status: { $ne: 'COMPLETED' } }).session`, `Assignment.exists`, `incident.statusHistory.push`, `incident.save`, `dispatchNotification` |
| `getAllVolunteers` | 386 | `User.find({ isActive: true }) .select('name email role isActive createdAt') .sort`, `User.find({ isActive: true }) .select`, `User.find`, `res.status(200).json`, `res.status`, `volunteers.map`, `v._id.toString` |

## server/src/controllers/assistantController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `assistantStatus` | 14 | `res.json`, `Boolean` |
| `generateAnswer` | 15 | `fetch`, `AbortSignal.timeout`, `JSON.stringify`, `createError`, `response.json`, `data.output?.filter(item => item.type === 'message').flatMap(item => item.content \|\| []).filter(item => item.type === 'output_text').map(item => item.text \|\| '').join`, `data.output?.filter(item => item.type === 'message').flatMap(item => item.content \|\| []).filter(item => item.type === 'output_text').map`, `data.output?.filter(item => item.type === 'message').flatMap(item => item.content \|\| []).filter`, `data.output?.filter(item => item.type === 'message').flatMap`, `data.output?.filter` |
| `askAssistant` | 32 | `createError`, `incidentReportDay`, `AssistantQuota.updateOne`, `AssistantQuota.findOneAndUpdate`, `now.getTime`, `Promise.all`, `Incident.find({ approvalStatus: 'APPROVED' }).sort({ updatedAt: -1 }).limit(30).select('title category severity status location updatedAt').lean`, `Incident.find({ approvalStatus: 'APPROVED' }).sort({ updatedAt: -1 }).limit(30).select`, `Incident.find({ approvalStatus: 'APPROVED' }).sort({ updatedAt: -1 }).limit`, `Incident.find({ approvalStatus: 'APPROVED' }).sort`, `Incident.find`, `Shelter.find().sort({ updatedAt: -1 }).limit(30).select('name status currentOccupancy capacity location updatedAt').lean`, `Shelter.find().sort({ updatedAt: -1 }).limit(30).select`, `Shelter.find().sort({ updatedAt: -1 }).limit` |

## server/src/controllers/authController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `register` | 15 | `createError`, `validatePasswordSecurity`, `passwordCheck.errors.join`, `User.findOne`, `email.toLowerCase`, `User.create`, `generateAccessToken`, `user._id.toString`, `res.status(201).json`, `res.status` |
| `login` | 72 | `User.findOne({ email: email.toLowerCase() }).select`, `User.findOne`, `email.toLowerCase`, `createError`, `user.comparePassword`, `generateAccessToken`, `user._id.toString`, `res.status(200).json`, `res.status` |
| `getCurrentUser` | 119 | `createError`, `User.findById`, `res.status(200).json`, `res.status` |
| `logout` | 150 | `res.status(200).json`, `res.status` |

## server/src/controllers/incidentController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `reviewIncident` | 13 | `Types.ObjectId.isValid`, `createError`, `Incident.findById`, `incident.statusHistory.push`, `incident.save`, `dispatchNotification`, `incident.reportedBy.toString`, `incident.approvalStatus.toLowerCase`, `populateIncidentRelations`, `res.json`, `formatIncident` |
| `formatUserRef` | 40 | `ref._id.toString`, `String` |
| `formatIncident` | 63 | `(incident.statusHistory ?? []).map`, `formatUserRef`, `incident._id.toString`, `(() => { const ref = formatUserRef(incident.reportedBy); return typeof ref === 'object' ? { id: ref.id, name: ref.name } : ref; })` |
| `populateIncidentRelations` | 104 | `incident.populate` |
| `createIncident` | 118 | `createError`, `incidentReportDay`, `Incident.countDocuments`, `User.findOneAndUpdate`, `Incident.create`, `User.updateOne`, `populateIncidentRelations`, `dispatchNotificationToRoles`, `res.status(201).json`, `res.status`, `formatIncident` |
| `getMyIncidents` | 190 | `createError`, `Incident.find({ reportedBy: req.user.id }) .sort({ createdAt: -1 }) .populate`, `Incident.find({ reportedBy: req.user.id }) .sort`, `Incident.find`, `res.status(200).json`, `res.status`, `incidents.map`, `formatIncident` |
| `getAllIncidents` | 211 | `Incident.find(filter) .sort({ createdAt: -1 }) .populate`, `Incident.find(filter) .sort`, `Incident.find`, `res.status(200).json`, `res.status`, `incidents.map`, `formatIncident` |
| `getPublicIncidents` | 240 | `Incident.find(filter) .sort({ createdAt: -1 }) .populate`, `Incident.find(filter) .sort`, `Incident.find`, `res.status(200).json`, `res.status`, `incidents.map`, `formatIncident` |
| `getIncidentById` | 273 | `createError`, `Types.ObjectId.isValid`, `Incident.findById`, `['authority', 'admin'].includes`, `incident.reportedBy.toString`, `populateIncidentRelations`, `res.status(200).json`, `res.status`, `formatIncident` |
| `updateIncidentStatus` | 304 | `createError`, `INCIDENT_STATUSES.includes`, `Incident.findById`, `status.replace`, `allowed.includes`, `incident.status.replace`, `Assignment.countDocuments`, `['RESOLVED', 'CLOSED'].includes`, `Assignment.exists`, `incident.statusHistory.push`, `incident.save`, `populateIncidentRelations`, `repRef._id.toString`, `String` |

## server/src/controllers/logisticsController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `transaction` | 11 | `mongoose.startSession`, `session.withTransaction`, `work`, `session.endSession` |
| `activeShelter` | 16 | `Shelter.findOneAndUpdate`, `createError` |
| `checkId` | 21 | `Types.ObjectId.isValid`, `createError` |
| `getLogistics` | 23 | `Promise.all`, `StorageLocation.find().sort({ name: 1 }).lean`, `StorageLocation.find().sort`, `StorageLocation.find`, `ShelterNeed.find().sort({ createdAt: -1 }).lean`, `ShelterNeed.find().sort`, `ShelterNeed.find`, `SupplyTransfer.find().sort({ createdAt: -1 }).lean`, `SupplyTransfer.find().sort`, `SupplyTransfer.find`, `ShelterStock.find().lean`, `ShelterStock.find`, `StockMovement.find().sort({ createdAt: -1 }).limit(100).lean`, `StockMovement.find().sort({ createdAt: -1 }).limit` |
| `createStorage` | 30 | `transaction`, `activeShelter`, `StorageLocation.create`, `res.status(201).json`, `res.status` |
| `bindStorage` | 41 | `transaction`, `StorageLocation.findById(req.body.storageId).session`, `StorageLocation.findById`, `Resource.findById(req.body.resourceId).session`, `Resource.findById`, `createError`, `String`, `activeShelter`, `resource.save`, `res.json` |
| `createNeed` | 58 | `transaction`, `activeShelter`, `ShelterNeed.create`, `res.status(201).json`, `res.status` |
| `suggestionsForNeed` | 66 | `checkId`, `ShelterNeed.findById(id).lean`, `ShelterNeed.findById`, `createError`, `Shelter.findById(need.shelterId).lean`, `Shelter.findById`, `Resource.find({ category: need.category, availableQuantity: { $gt: 0 }, status: { $ne: 'MAINTENANCE' }, storageId: { $exists: true } }).lean`, `Resource.find`, `StorageLocation.find({ _id: { $in: resources.map(r => r.storageId) } }).lean`, `StorageLocation.find`, `resources.map`, `Shelter.find({ _id: { $in: storage.map(s => s.shelterId).filter(Boolean) }, status: { $ne: 'INACTIVE' } }).select('_id').lean`, `Shelter.find({ _id: { $in: storage.map(s => s.shelterId).filter(Boolean) }, status: { $ne: 'INACTIVE' } }).select`, `Shelter.find` |
| `getSuggestions` | 85 | `res.json`, `suggestionsForNeed` |
| `reserveTransfer` | 87 | `transaction`, `SupplyTransfer.findOne({ createdBy: req.user!.id, requestKey: req.body.requestKey }).session`, `SupplyTransfer.findOne`, `String`, `createError`, `ShelterNeed.findById(req.body.needId).session`, `ShelterNeed.findById`, `Resource.findById(req.body.resourceId).session`, `Resource.findById`, `activeShelter`, `StorageLocation.findById(resource.storageId).session`, `StorageLocation.findById`, `matchesNeed`, `shortage` |
| `transitionTransfer` | 114 | `checkId`, `transaction`, `SupplyTransfer.findById(req.params.id).session`, `SupplyTransfer.findById`, `createError`, `assertTransferAction`, `ShelterNeed.findById(transfer.needId).session`, `ShelterNeed.findById`, `Resource.findById(transfer.resourceId).session`, `Resource.findById`, `activeShelter`, `StorageLocation.findById(transfer.storageId).session`, `StorageLocation.findById`, `resource.save` |
| `consumeStock` | 148 | `transaction`, `StockMovement.findOne({ requestKey: key }).session`, `StockMovement.findOne`, `ShelterStock.findById(req.body.stockId).session`, `ShelterStock.findById`, `createError`, `String`, `stock.save`, `StockMovement.create`, `res.json` |

## server/src/controllers/mapController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `getMapIncidents` | 11 | `Incident.find(['authority', 'admin'].includes(_req.user?.role ?? '') ? {} : { approvalStatus: 'APPROVED' }) .select('title category severity status location') .sort({ createdAt: -1 }) .lean`, `Incident.find(['authority', 'admin'].includes(_req.user?.role ?? '') ? {} : { approvalStatus: 'APPROVED' }) .select('title category severity status location') .sort`, `Incident.find(['authority', 'admin'].includes(_req.user?.role ?? '') ? {} : { approvalStatus: 'APPROVED' }) .select`, `Incident.find`, `['authority', 'admin'].includes`, `res.status(200).json`, `res.status`, `incidents.map`, `incident._id.toString` |

## server/src/controllers/notificationController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatNotification` | 8 | `notification._id.toString`, `notification.recipient.toString` |
| `getMyNotifications` | 24 | `createError`, `Notification.find({ recipient: req.user.id }) .sort({ createdAt: -1 }) .limit`, `Notification.find({ recipient: req.user.id }) .sort`, `Notification.find`, `Notification.countDocuments`, `res.status(200).json`, `res.status`, `notifications.map` |
| `markAsRead` | 51 | `createError`, `Types.ObjectId.isValid`, `Notification.findOne`, `notification.save`, `res.status(200).json`, `res.status`, `formatNotification` |
| `markAllAsRead` | 84 | `createError`, `Notification.updateMany`, `res.status(200).json`, `res.status` |

## server/src/controllers/resourceController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatResource` | 11 | `resource._id.toString`, `resource.storageId?.toString`, `(resource.allocations ?? []).map`, `incRef._id.toString`, `String` |
| `getAllResources` | 42 | `Resource.find(filter) .sort({ name: 1 }) .populate`, `Resource.find(filter) .sort`, `Resource.find`, `res.status(200).json`, `res.status`, `resources.map`, `formatResource`, `['authority', 'admin'].includes` |
| `getResourceById` | 68 | `Types.ObjectId.isValid`, `createError`, `Resource.findById(req.params.id) .populate`, `Resource.findById`, `res.status(200).json`, `res.status`, `formatResource`, `['authority', 'admin'].includes` |
| `createResource` | 91 | `createError`, `RESOURCE_CATEGORIES.includes`, `Number`, `Number.isFinite`, `Resource.create`, `res.status(201).json`, `res.status`, `formatResource` |
| `updateResource` | 130 | `Types.ObjectId.isValid`, `createError`, `Resource.findById`, `RESOURCE_CATEGORIES.includes`, `Number`, `Number.isFinite`, `resource.allocations.reduce`, `RESOURCE_STATUSES.includes`, `resource.save`, `res.status(200).json`, `res.status`, `formatResource` |
| `deleteResource` | 190 | `Types.ObjectId.isValid`, `createError`, `Resource.findOneAndDelete`, `Resource.exists`, `res.status(200).json`, `res.status` |
| `allocateResource` | 212 | `Types.ObjectId.isValid`, `createError`, `Incident.findById`, `Resource.findById`, `canOfferHelp`, `Number`, `Number.isFinite`, `resource.allocations.push`, `resource.save`, `dispatchNotificationToRoles`, `resource.populate`, `res.status(200).json`, `res.status`, `formatResource` |
| `releaseResource` | 280 | `Types.ObjectId.isValid`, `createError`, `Resource.findById`, `resource.allocations.findIndex`, `a.incidentId.toString`, `resource.allocations.splice`, `Math.min`, `resource.save`, `res.status(200).json`, `res.status`, `formatResource` |

## server/src/controllers/shelterController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatShelter` | 8 | `shelter._id.toString` |
| `getAllShelters` | 27 | `Shelter.find(filter).sort`, `Shelter.find`, `res.status(200).json`, `res.status`, `shelters.map` |
| `getShelterById` | 48 | `Types.ObjectId.isValid`, `createError`, `Shelter.findById`, `res.status(200).json`, `res.status`, `formatShelter` |
| `createShelter` | 69 | `createError`, `Shelter.create`, `res.status(201).json`, `res.status`, `formatShelter` |
| `updateShelter` | 106 | `Types.ObjectId.isValid`, `createError`, `Shelter.findById`, `SHELTER_STATUSES.includes`, `shelter.save`, `res.status(200).json`, `res.status`, `formatShelter` |
| `deleteShelter` | 164 | `Types.ObjectId.isValid`, `createError`, `Shelter.findOneAndDelete`, `Shelter.exists`, `res.status(200).json`, `res.status` |

## server/src/controllers/volunteerController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatUserRef` | 8 | `ref._id.toString`, `String` |
| `formatIncidentRef` | 29 | `ref._id.toString`, `String` |
| `getAllVolunteers` | 65 | `Promise.all`, `VolunteerRequest.find({ status: 'APPROVED' }) .populate('userId', 'name email role isActive') .populate`, `VolunteerRequest.find({ status: 'APPROVED' }) .populate`, `VolunteerRequest.find`, `Assignment.find({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } }) .populate('volunteerId', 'name email role isActive') .populate`, `Assignment.find({ status: { $in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } }) .populate`, `Assignment.find`, `assignments.map`, `assignment.volunteerId.toString`, `assignment.incidentId.toString`, `ref._id.toString`, `responderMap.get`, `existing.activeIncidents.set`, `existing.activeAssignments.some` |
| `addUser` | 96 | `ref._id.toString`, `responderMap.get`, `existing.activeIncidents.set`, `existing.activeAssignments.some`, `existing.activeAssignments.push`, `responderMap.set` |
| `getVolunteerById` | 175 | `createError`, `Assignment.findOne({ volunteerId: req.params.id, }) .populate('volunteerId', 'name email role isActive') .populate`, `Assignment.findOne({ volunteerId: req.params.id, }) .populate`, `Assignment.findOne`, `res.status(200).json`, `res.status`, `formatUserRef`, `formatIncidentRef` |

## server/src/controllers/volunteerRequestController.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `formatUserRef` | 12 | `ref._id.toString`, `String` |
| `formatIncidentRef` | 35 | `ref._id.toString`, `String` |
| `formatVolunteerRequest` | 54 | `request._id.toString`, `formatUserRef`, `formatIncidentRef`, `canOfferHelp` |
| `populateVolunteerRequest` | 75 | `request.populate` |
| `createVolunteerRequest` | 89 | `createError`, `Types.ObjectId.isValid`, `Incident.findById`, `canOfferHelp`, `VolunteerRequest.findOne`, `VolunteerRequest.create`, `populateVolunteerRequest`, `dispatchNotificationToRoles`, `res.status(201).json`, `res.status`, `formatVolunteerRequest` |
| `getVolunteerRequestsByIncident` | 160 | `Types.ObjectId.isValid`, `createError`, `Incident.findById(incidentId).select`, `Incident.findById`, `VolunteerRequest.find({ incidentId }) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate('incidentId', 'title category severity status approvalStatus') .populate`, `VolunteerRequest.find({ incidentId }) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate`, `VolunteerRequest.find({ incidentId }) .sort({ createdAt: -1 }) .populate`, `VolunteerRequest.find({ incidentId }) .sort`, `VolunteerRequest.find`, `res.status(200).json`, `res.status`, `requests.map`, `formatVolunteerRequest` |
| `getAllVolunteerRequests` | 194 | `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate('incidentId', 'title category severity status approvalStatus') .populate`, `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate`, `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate`, `VolunteerRequest.find(filter) .sort`, `VolunteerRequest.find`, `res.status(200).json`, `res.status`, `requests.map`, `formatVolunteerRequest` |
| `getMyVolunteerRequests` | 223 | `createError`, `Types.ObjectId.isValid`, `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate('incidentId', 'title category severity status approvalStatus') .populate`, `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate('userId', 'name email role') .populate`, `VolunteerRequest.find(filter) .sort({ createdAt: -1 }) .populate`, `VolunteerRequest.find(filter) .sort`, `VolunteerRequest.find`, `res.status(200).json`, `res.status`, `requests.map`, `formatVolunteerRequest` |
| `reviewVolunteerRequest` | 257 | `createError`, `Types.ObjectId.isValid`, `VolunteerRequest.db.transaction`, `VolunteerRequest.findById(req.params.id).session`, `VolunteerRequest.findById`, `Incident.findById(request.incidentId).session`, `Incident.findById`, `canOfferHelp`, `Assignment.findOne({ incidentId: request.incidentId, volunteerId: request.userId }).session`, `Assignment.findOne`, `Assignment.create`, `incident.statusHistory.push`, `incident.save`, `request.save` |

## server/src/index.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `start` | 59 | `connectDB`, `httpServer.listen`, `Number`, `console.log` |

## server/src/middleware/authMiddleware.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `authenticate` | 16 | `authHeader.startsWith`, `next`, `createError`, `authHeader.split`, `verifyAccessToken`, `User.findById(decodedPayload.id).select`, `User.findById`, `user._id.toString` |

## server/src/middleware/errorHandler.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `errorHandler` | 13 | `console.error`, `res.status(statusCode).json`, `res.status` |
| `createError` | 36 |  |

## server/src/middleware/roleGuard.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `roleGuard` | 14 | `next`, `createError`, `allowedRoles.includes`, `allowedRoles.join` |

## server/src/models/Logistics.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `ref` | 2 |  |

## server/src/socket/index.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `initSocket` | 10 | `io.use`, `verifyAccessToken`, `User.findById(payload.id).select`, `User.findById`, `next`, `user._id.toString`, `io.on`, `console.log`, `socket.join`, `socket.on` |
| `getIO` | 45 |  |
| `dispatchNotification` | 52 | `Notification.create`, `getIO`, `activeIo.to(`user:${options.recipientId}`).emit`, `activeIo.to`, `notification._id.toString`, `console.error` |
| `dispatchNotificationToRoles` | 90 | `User.find({ role: { $in: options.roles }, isActive: true }).select`, `User.find`, `users.map`, `dispatchNotification`, `u._id.toString`, `Promise.all`, `console.error` |

## server/src/utils/asyncHandler.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `asyncHandler` | 15 | `Promise.resolve(fn(req, res, next)).catch`, `Promise.resolve`, `fn` |

## server/src/utils/incidentPolicy.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `canOfferHelp` | 10 | `['UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS'].includes` |
| `incidentReportDay` | 15 | `new Date(now.getTime() + 330 * 60_000).toISOString().slice`, `new Date(now.getTime() + 330 * 60_000).toISOString`, `now.getTime` |

## server/src/utils/jwt.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `generateAccessToken` | 14 | `jwt.sign` |
| `verifyAccessToken` | 24 | `jwt.verify` |

## server/src/utils/logisticsPolicy.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `normalizeItem` | 1 | `value.trim().toLowerCase().replace`, `value.trim().toLowerCase`, `value.trim` |
| `shortage` | 2 | `Math.max` |
| `distanceKm` | 3 | `radians`, `Math.sin`, `Math.cos`, `Math.round`, `Math.asin`, `Math.sqrt`, `Math.min` |
| `radians` | 4 |  |
| `matchesNeed` | 9 | `normalizeItem` |
| `assertTransferAction` | 12 | `['DISPATCHED', 'CANCELLED'].includes` |

## server/src/utils/logisticsValidation.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `text` | 4 | `z.string().trim().transform(sanitizeInputText).pipe`, `z.string().trim().transform`, `z.string().trim`, `z.string`, `z.string().min(min).max`, `z.string().min` |

## server/src/utils/passwordSecurity.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `validatePasswordSecurity` | 13 | `errors.push`, `/[A-Z]/.test`, `/[a-z]/.test`, `/[0-9]/.test`, `/[!@#$%^&*()_+\-=[\]{};':"\\\|,.<>/?]/.test` |

## server/src/utils/phone.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `isValidMobile` | 2 | `/^[6-9]\d{9}$/.test`, `/^(\d)\1{9}$/.test`, `/^(\d{2})\1{4}$/.test`, `/^(\d{5})\1$/.test`, `['01234567890123456789', '98765432109876543210'].some`, `sequence.includes` |

## server/src/utils/validators.ts

| Function | Line | Calls / working trace (first 14) |
| --- | ---: | --- |
| `validateBody` | 10 | `schema.safeParse`, `res.status(400).json`, `res.status`, `result.error.flatten`, `next` |
| `sanitizeInputText` | 29 | `text .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') .replace(/<[^>]+>/g, '') .replace(/javascript:/gi, '') .replace(/onerror\s*=/gi, '') .replace(/onload\s*=/gi, '') .trim`, `text .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') .replace(/<[^>]+>/g, '') .replace(/javascript:/gi, '') .replace(/onerror\s*=/gi, '') .replace`, `text .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') .replace(/<[^>]+>/g, '') .replace(/javascript:/gi, '') .replace`, `text .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') .replace(/<[^>]+>/g, '') .replace`, `text .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') .replace`, `text .replace` |

Total named function definitions: 295.
