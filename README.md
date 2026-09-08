# DRECS — Disaster Response & Emergency Coordination System

[![Production Readiness](https://img.shields.io/badge/Status-Production--Ready-emerald?style=flat-square)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?style=flat-square&logo=typescript)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black?style=flat-square&logo=next.js)](#)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)](#)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js)](#)
[![Express](https://img.shields.io/badge/Express-4.19.2-lightgrey?style=flat-square&logo=express)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas%20(Mongoose%208.4.0)-forestgreen?style=flat-square&logo=mongodb)](#)
[![Socket.IO](https://img.shields.io/badge/RealTime-Socket.IO%204.7.5-010101?style=flat-square&logo=socket.io)](#)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20SDK%207.8.0-purple?style=flat-square&logo=openai)](#)

> **DRECS** is a full-stack, enterprise-grade emergency dispatch and crisis management platform designed to centralize incident reporting, coordinate emergency authorities, mobilize volunteer response forces, and optimize resource allocation during natural and man-made disasters.

---

## 📌 Real-Life Emergency Use Cases

In high-stress disaster scenarios—such as flash floods, severe earthquakes, cyclones, fires, or structural collapses—communication channels quickly become overwhelmed with duplicate, ambiguous, or false reports. **DRECS** solves these critical real-world bottlenecks:

1. **Rapid Field Incident Dispatch & GPS Triangulation**
   - Citizens and field personnel can instantly submit incident reports with automated browser GPS coordinates (`Latitude`/`Longitude`) and landmark addresses, eliminating location ambiguity during emergency rescues.

2. **Automated AI Content Moderation & Spam Shield**
   - Automatically filters out keyboard-mash spam (e.g., `asdasd`, `qwerty`), random numbers (`12312 41jk23`), mixed character noise, and non-emergency test entries before they clutter emergency command queues.

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
| **Global Emergency Favicon** | ✅ Complete | Custom emergency badge SVG favicon rendered globally across browser tabs. |
| **Shelter & Resource Management** | ✅ Complete | Full CRUD operations, capacity counters, low-stock warnings, allocation tracking. |
| **Volunteer Task Management** | ✅ Complete | Task request submission, authority approval workflow, assignment tracking. |
| **Tactical Dark UI Console** | ✅ Complete | High-contrast, zero-glare dark console designed for 24/7 crisis command centers. |
| **WebSocket Real-time Sync** | ✅ Complete | Socket.IO server emitting live notifications for incident updates and assignments. |
| **System Analytics Dashboard** | ✅ Complete | Dynamic charts (Recharts) visualizing operational metrics, resource status, and severity breakdown. |

---

## 🛠️ Complete Tech Stack & Exact Service Versions

### Backend Services & Dependencies (`server/package.json`)
* **Node.js**: Runtime environment (v18+ / v20.x recommended)
* **TypeScript**: `^5.4.5` — Full end-to-end static typing
* **Express.js**: `^4.19.2` — REST API framework
* **MongoDB Atlas & Mongoose**: `^8.4.0` — Cloud NoSQL database with ODM schemas, validation, and hooks
* **Socket.IO**: `^4.7.5` — Real-time bi-directional event transport for live dispatch notifications
* **OpenAI SDK**: `^7.8.0` — Content moderation (`omni-moderation-latest`) & disaster severity assessment (`gpt-4o-mini`)
* **Zod**: `^3.23.8` — Schema declaration, validation, and sanitization
* **jsonwebtoken (JWT)**: `^9.0.2` — Stateless role-based authentication tokens
* **bcryptjs**: `^2.4.3` — Password hashing with salt factor 12
* **Multer**: `^1.4.5-lts.1` — Multipart form-data parser for media/photo uploads
* **CORS**: `^2.8.5` — Cross-origin resource sharing policy management
* **Dotenv**: `^16.4.5` — Environment configuration management
* **Morgan**: `^1.10.0` — HTTP request logger

### Frontend Services & Dependencies (`client/package.json`)
* **Next.js**: `14.2.3` (App Router) — Server-side rendering, static page generation, and optimized client routing
* **React & React DOM**: `^18.3.1` — UI component framework
* **TypeScript**: `^5.4.5` — Full frontend typing and API contract synchronization
* **Tailwind CSS**: `^3.4.3` — Utility-first tactical dark console styling
* **Lucide React**: `^0.383.0` — Unified iconography set
* **Leaflet**: `^1.9.4` & **react-leaflet**: `^4.2.1` — Interactive GIS disaster mapping (SSR-safe)
* **Recharts**: `^2.12.7` — Telemetry & analytics data visualizations
* **Axios**: `^1.7.2` — HTTP client with interceptors for JWT token attachment and refresh
* **Socket.IO Client**: `^4.7.5` — Real-time event listener for live alerts and updates
* **PostCSS**: `^8.4.38` & **Autoprefixer**: `^10.4.19` — CSS preprocessing pipeline

---

## 💻 Zero-Friction Setup Guide (Cloning to Another Laptop)

To run **DRECS** on any fresh machine/laptop, simply follow these steps:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Het28091/DRECS.git
cd DRECS
```

---

### Step 2: Configure & Start Backend (`server`)

Open a terminal in the root directory:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://hetprajapati:hetprajapati@cluster0.79mz6xp.mongodb.net/drecs?retryWrites=true&w=majority
JWT_SECRET=drecs_production_jwt_secret_key_2026_secure
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
```
*(Note: If `OPENAI_API_KEY` is left blank, DRECS automatically falls back to its built-in local rule-based verification engine!)*

Run the backend dev server:
```bash
npm run dev
```
*(Server will start on `http://localhost:5000`)*

---

### Step 3: Configure & Start Frontend (`client`)

Open a second terminal in the root directory:

```bash
cd client
npm install
```

Create a `.env.local` file in the `client/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Run the frontend client dev server:
```bash
npm run dev
```
*(Client will start on `http://localhost:3000`)*

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔒 Comprehensive Validation & Security Posture

DRECS enforces strict, multi-layered security validation across all forms:

* **Title Field:** Min 3, Max 120 chars. Whitespace-only inputs rejected. Sanitized against XSS (`<script>`, `<img onerror>`), SQL Injection, and HTML tags.
* **Description Field:** Min 10, Max 2000 chars. Whitespace-only inputs rejected. Preserves line breaks & multiline paragraphs. Rejects random numbers, digit mashing, and mixed alphanumeric noise (`12312 41jk23 41`).
* **Landmark / Street Address (Optional):** Max 300 chars. Optional field (report submits successfully when left blank). Accepts apartment numbers, ZIP codes, intersections, landmarks, and international/Unicode characters (`Near मंदिर`, `شارع الملك فهد`, `北京市朝阳区`).
* **Title + Description Combination:** Rejects identical Title and Description strings.
* **Enterprise Password Security:** Enforces 8+ characters, uppercase, lowercase, numeric digit, and special character.
* **Role-Based Access Control (RBAC):** Token-based protection for `citizen`, `volunteer`, `authority`, and `admin` roles.

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

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
