# DRECS — Disaster Response & Emergency Coordination System

[![Production Readiness](https://img.shields.io/badge/Status-Production--Ready-emerald?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](#)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen?style=flat-square&logo=mongodb)](#)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20Moderation%20%26%20GPT--4o--Mini-purple?style=flat-square&logo=openai)](#)

> **DRECS** is a full-stack, enterprise-grade emergency dispatch and crisis management platform designed to centralize incident reporting, coordinate emergency authorities, mobilize volunteer response forces, and optimize resource allocation during natural and man-made disasters.

---

## 📌 Real-Life Emergency Use Cases

In high-stress disaster scenarios—such as flash floods, severe earthquakes, cyclones, fires, or structural collapses—communication channels quickly become overwhelmed with duplicate, ambiguous, or false reports. **DRECS** solves these critical real-world bottlenecks:

1. **Rapid Field Incident Dispatch & GPS Triangulation**
   - Citizens and field personnel can instantly submit incident reports with automated browser GPS coordinates (`Latitude`/`Longitude`) and landmark addresses, eliminating location ambiguity during emergency rescues.

2. **Automated AI Content Moderation & Spam Shield**
   - Automatically filters out keyboard-mash spam (e.g. `asdasd`, `qwerty`), repetitive character entropy, and non-emergency test entries before they clutter emergency command queues.

3. **Lore-Accurate AI Priority Arbitration (UN / FEMA Standard)**
   - Evaluates submitted reports against official disaster severity guidelines (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - **Arbitration Rule:** If the user-selected priority matches the AI assessment, it is confirmed. If they differ, the **AI makes the final decision** to prevent panic-induced priority inflation or dangerous under-reporting.

4. **Real-time Incident Command Console for Authorities**
   - Emergency authorities obtain a real-time live map interface (Leaflet GIS) displaying incident severity pinpoints and shelter status, with live WebSocket updates (`Socket.IO`).

5. **Shelter & Resource Inventory Tracking**
   - Tracks shelter capacity, current occupancy, and available emergency supplies (food, water, medical kits, rescue boats) to prevent resource starvation in crisis zones.

6. **Volunteer Force Mobilization**
   - Enables volunteers to apply, view assigned field tasks, update task progress, and submit status logs under authority supervision.

---

## 🚀 Current Level of Progress & Status

| Module / System Layer | Status | Implementation Details |
| :--- | :---: | :--- |
| **Authentication & RBAC** | ✅ Complete | JWT tokens, bcrypt hashing, 5-point password complexity enforcement, role guards (`citizen`, `volunteer`, `authority`, `admin`). |
| **Incident Reporting & GPS** | ✅ Complete | Dynamic form validation, one-click GPS location detection, image upload support. |
| **AI Content Moderation** | ✅ Complete | Multi-tiered verification (local pattern engine + OpenAI Free Moderation API + GPT-4o-Mini emergency analyzer). |
| **AI Priority Arbitration** | ✅ Complete | Lore-accurate UN/FEMA severity evaluation with user vs AI priority arbitration rules. |
| **Live Interactive GIS Map** | ✅ Complete | Leaflet map with custom severity markers, popup details, and shelter overlays (SSR-safe). |
| **Shelter & Resource Management** | ✅ Complete | Full CRUD operations, capacity counters, low-stock warnings, allocation tracking. |
| **Volunteer Task Management** | ✅ Complete | Task request submission, authority approval workflow, assignment tracking. |
| **Tactical Dark UI Console** | ✅ Complete | High-contrast, zero-glare dark console designed for 24/7 crisis command centers. |
| **WebSocket Real-time Sync** | ✅ Complete | Socket.IO server emitting live notifications for incident updates and assignments. |

---

## 🔮 Post-Completion Expectations & Roadmap

Future operational enhancements planned for deployment in low-connectivity disaster zones:

1. **Progressive Web App (PWA) Offline Synchronization**
   - Local storage of incident submissions using IndexedDB, automatically syncing with MongoDB when mobile network connectivity is restored.
2. **Twilio SMS Fallback Gateway**
   - SMS-based report submission and emergency alerts for citizens in areas without cellular data coverage.
3. **Computer Vision Damage Assessment**
   - Integration of multi-modal AI vision models (Gemini 1.5 Vision / GPT-4o Vision) to automatically verify structural damage photos submitted by citizens.

---

## 🔒 Security Posture & Production Hardening

- **Enterprise Password Policy:** Enforces 8+ characters, uppercase, lowercase, numeric digits, and special characters.
- **Fail-Fast Controller Defense:** Rejects invalid/spam requests at the API layer before DB reads or socket broadcasts.
- **Role-Based Access Control (RBAC):** Strict endpoint protection restricting administrative operations to authorized roles.
- **Injection & XSS Protection:** Mongoose schema sanitization and structured payload typing.

---

## 🛠️ Tech Stack Architecture

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Leaflet GIS.
- **Backend:** Node.js, Express.js, TypeScript, Socket.IO, Mongoose.
- **Database:** MongoDB Atlas Cloud Cluster.
- **AI Integration:** OpenAI API (`omni-moderation-latest` & `gpt-4o-mini`).

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB instance)
- OpenAI API Key (optional for AI moderation)

### 1. Backend Setup
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key
```

Run the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
```

Configure `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Run the frontend client:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
