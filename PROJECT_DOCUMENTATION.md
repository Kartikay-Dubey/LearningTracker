# Project Documentation: LearnTrack – Personal Learning Tracker

## 1. Project Overview

### What the Project is About
**LearnTrack** is a beautifully designed, gamified, and modern web application aimed at tracking personal learning goals. It integrates standard goal management with gamification elements like XP, streaks, and achievements to keep users motivated.

### The Main Purpose
To provide an interactive platform where users can efficiently organize their learning milestones visually, monitor progress, and get rewarded through a structured system of achievements.

### The Problem it Solves
Learning can often become monotonous or lose steam over time. LearnTrack solves the problem of declining motivation by introducing gamification (XP, Badges, Streaks) wrapped in an interactive dashboard to make continuous learning visually rewarding.

### Target Users
Students, self-taught developers, professionals learning new skills, and lifelong learners needing motivation.

### Overall Architecture
The application uses a decoupled Single-Page Application (SPA) architecture. The client-side is entirely handled by React, utilizing global state management to handle application logic (Zustand), while Authentication and Cloud Storage are delegated to Supabase. A nimble Express backend handles compute-heavy AI tasks securely without exposing API keys.

### Type of Project
Full-stack Web Application.

### Technologies, Frameworks, and Languages Used
**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, HTML5
**State Management:** Zustand
**Animations & Visuals:** Framer Motion, GSAP, Recharts, React Three Fiber (Three.js)
**Backend:** Node.js, Express
**Auth & Database:** Supabase (PostgreSQL)

---

## 2. Folder Structure Documentation

### Root Directory Structure

```text
learning-tracker/
├── backend/            # Express.js backend for AI integrations
├── public/             # Static files and assets
├── src/                # Frontend React application source code
│   ├── assets/         # Images, global static assets
│   ├── components/     # Reusable React components
│   │   ├── features/   # Feature-specific component blocks
│   │   ├── forms/      # Input forms and validation components
│   │   ├── layout/     # Structural components (Navbars, sidebars etc.)
│   │   └── ui/         # Basic, reusable UI components (Buttons, inputs)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Configuration for third party services (Supabase)
│   ├── pages/          # React route endpoints (Views)
│   ├── stores/         # Global Zustand state management logic
│   ├── styles/         # Additional CSS/Tailwind configs
│   └── types/          # Global TypeScript interfaces
├── .env                # Client-side environment variables
├── .gitignore          # Git ignores
├── eslint.config.js    # ESLint configurations
├── netlify.toml        # Netlify deployment configs
├── package.json        # Frontend NPM Dependencies & Scripts
├── tailwind.config.cjs # Tailwind Design System configurations
├── tsconfig.json       # TypeScript compiler options
└── vite.config.ts      # Vite bundler configurations
```

### Folder Explanations
- **`src/`**: Houses all core logic, styling, and application interfaces for the frontend application.
- **`backend/`**: A separate Node module meant exclusively for interacting with the OpenAI API secretly from the frontend.
- **`src/components/`**: Uses an atomic approach structure separating core standard `ui` elements from structural `layout` views and abstract `features`.
- **`src/stores/`**: Houses core business logic.

---

## 3. File Level Documentation

### `src/App.tsx`
- **Purpose**: Main routing and wrapper configuration.
- **Functionality**: Wraps the application in a `Router` and controls standard overarching themes (dark mode states) alongside handling `react-hot-toast` positioning.
- **Interacts with**: `stores/useStore.ts` (theme detection) and dynamically mounts different components inside `src/pages/`.

### `src/stores/useStore.ts`
- **Purpose**: Managing the global application state.
- **Functionality**: Holds logic for creating, modifying, and completing `Goals`, allocating `Achievements`, computing `UserStats` (Streak and XP logic), and managing current application session statuses. It utilizes `zustand/middleware` (persist) to automatically retain data using `localStorage`.

### `src/lib/supabaseClient.ts`
- **Purpose**: Initializes connection to the Supabase Cloud Backend.
- **Functionality**: Injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to expose the client singleton to other modules responsible for authentication.

### `backend/index.js`
- **Purpose**: Backend server entry point.
- **Functionality**: Spins up an Express.js server functioning on Port `5001`. Primarily provisions an endpoint (`/api/generate-goals`) that safely communicates with the `OpenAI` API natively without exposing the developer key to the frontend client network tab.

---

## 4. Code Explanation

### Core Logic & Flow
When a user launches the web application, `useStore` injects cached learning streaks and gamification state (goals array, XP score, achievements). If they use the gamified tools:
1. They add a generic Goal in the frontend.
2. `addGoal` updates internal store schemas.
3. Upon goal completion (`updateGoal`), internal store triggers `checkAchievements()`, `updateStreak()`, and `addXP()`. This cascading design updates Gamification triggers simultaneously.

### API Routes (Backend)
- **`POST /api/generate-goals`**:
  An asynchronous function picking up `syllabusText`. Connects to a standard system prompt querying the `gpt-3.5-turbo` language model. Processes completion formats to enforce smartly generated goals (Difficulty, Time Estimate).

### Error Handling & Logging
The express backend wraps asynchronous operations utilizing typical `try-catch` blocks and provides explicit `res.status(500)` returns alongside internal `console.error` logs to capture HTTP failures during the OpenAI calls. The Frontend uses `react-hot-toast` libraries to intercept those HTTP failures globally and report them cleanly onto the browser without crashing the DOM.

---

## 5. Dependencies and Libraries

### Frontend Libraries (`package.json`)
- **`react` & `react-dom`**: Core SPA structural library.
- **`vite`**: Rapid compilation bundler handling HMR and minification.
- **`zustand`**: Barebones and high-performance global state manager removing traditional Redux boilerplate needs.
- **`framer-motion` & `gsap` & `three`**: Premium interactive animation libraries driving the UI experience and scrollytelling capabilities to gamify transitions.
- **`@supabase/supabase-js`**: Remote bindings to postgres and cloud features.
- **`tailwindcss` & `@tailwindcss/forms`**: Atomic CSS system minimizing external stylesheets.
- **`react-hook-form` & `zod`**: Manages controlled states for inputs. Validates strictly generated form data dynamically.
- **`recharts`**: Handles high-performance SVG-based analytical data-dashboards.

### Backend Libraries (`backend/package.json`)
- **`express`**: Lightweight server router.
- **`dotenv`**: Config injection securely into `process.env`.
- **`cors`**: Bridges security blockages permitting frontend port (Vite Port 5173 natively) to exchange standard API calls with backend (Port 5001).

---

## 6. Database Documentation

**Database Type:** Supabase / PostgreSQL natively.
Currently relying gracefully on a hybrid approach. User Sessions and Cloud Storage refer robustly to the Supabase setup. However, standard tracking metrics fall back extensively into Client Storage limits (`zustand/persist`).

- **Internal Store Shape (`useStore.ts`)** (Analogous to Data Shape):
  - `Goal`: Attributes include `{ id, title, description, category, status, targetDate, subTasks, notes }`.
  - `Achievement`: `{ id, category, progress, rarity, xpReward }`.
  - `UserStats`: Tracking integers natively handling calculations for Level, Longest Streak, XP integers.

---

## 7. API Documentation

### `generate-goals` Endpoint
- **URL**: `http://localhost:5001/api/generate-goals`
- **Method**: `POST`
- **Request Body Format**:
  ```json
  {
     "syllabusText": "..."
  }
  ```
- **Response Format**: OpenAI Generative text returning parsed JSON. Structured to identify Goal Title, Description, XP Level.
- **Status Codes**: `200` (Success), `400` (Missing Body Param), `500` (Failed to trigger OpenAI).

---

## 8. Setup and Installation Guide

### System Requirements
- Node.js (v18 or higher recommended)
- Git

### 1. Installation Steps
Clone and navigate inside the main path:
```bash
git clone <url>
cd learning-tracker
npm install
```

### 2. Backend Setup
Navigate into backend path:
```bash
cd backend
npm install
```
Create a `.env` file within the `backend/` folder and setup your OpenAI key:
```env
OPENAI_API_KEY="your-openai-api-key"
PORT=5001
```

### 3. Frontend Environment Configuration
Create an `.env` file in the repository root:
```env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Running the Development Modules
Open two terminal instances.
Backend: `cd backend && node index.js`
Frontend: `npm run dev`

### 5. Build for Production
Run `npm run build` in the root folder. Vite will construct pure minified JS inside the `/dist` output folder.

---

## 9. Workflow / Execution Flow

**Initialization:** React `main.tsx` activates standard rendering. Zustand internally mounts onto `localStorage` pulling all previously stored Goal/Achievement shapes silently under `.Provider.` boundaries.

**Request Workflow Execution (Generative Goal Mapping):**
1. User interacting with front-end clicks "Generate from Syllabus".
2. `syllabusText` pushed against `localhost:5001/api/generate-goals` endpoint inside the frontend services.
3. Express server proxies parameter directly into the `GPT` integration system parameters.
4. Response is filtered via express memory, pushed back structurally to the Frontend.
5. Users UI converts JSON tree against `addGoal` mutations appending the resulting data to the active Global Zustand store dynamically reacting in real time with visuals.

---

## 10. Testing

Currently, standard testing frameworks (Jest, Cypress, RTL) are omitted from the project. Standard dependencies refer only to basic `npm start` environments. No test commands are heavily configured beyond standard generic npm stubs.

---

## 11. Security Considerations

- **Secure API Practices**: AI Integrations are correctly abstracted into a dedicated Node layer ensuring zero frontend leak risks inside the DOM `window`.
- **CORS Handling**: Backend integrates cross-origin checks avoiding request hijacking.
- **Third Party Management**: Auth integrations abstract entirely off external cookies referring to strictly signed Supabase JWT validations safely isolated from component logics.
- **Environment Handling**: Essential variables are strictly prefixed and removed from version controls using `.gitignore`.

---

## 12. Future Improvements

- **Database Full Implementation**: Migrate the logic presently handled by local `zustand/persist` exclusively into Supabase database tables (`goals`, `user_stats`). This eliminates data loss during multiple-device log ins and leverages PostgREST.
- **Performance Adjustments**: Setup lazy-loading boundaries natively inside React elements. Interactive elements holding 3D components (`@react-three/fiber`) heavily inflate chunk initializations requiring component level chunk-splitting optimizations.
- **Testing Coverage**: Establish end-to-end user validations wrapping Cypress testing against the Gamification system (Checking properly if specific XP is allocated when standard arrays are met).
- **Backend Type Safety**: Replicate current JavaScript Backend models against strict TypeScript standard implementations preventing JSON crashes.

---

## 13. Deep Dive: Feature Internals & Aesthetics

Based on deep exploration of raw source code, here are the extensive internal mechanics covering Gamification, Data structures, Animation trees, and Visual Effects implementations across the UI directories.

### 13.1 Gamification Engine (`useStore.ts`)
- **XP Ecosystem**: `useStore.ts` acts as the mastermind for the gamification cycle.
  - Adding a Goal does not grant XP, but marking its status as `"Completed"` triggers `addXP(100)`.
  - Levels are algorithmicly bound. The system sets the user level by calculating: `Math.floor(newTotalXP / 1000) + 1`. Ergo, a user hits Level 2 upon accumulating 1000 XP natively without maintaining arbitrary array lengths.
- **Streaks System**: The system intercepts the user's `lastActivityDate` mapping it against the `currentDate`. If the mathematical intersection equals `1`, it extends the `currentStreak`. If the delta is `0` (same day interaction), it maintains the streak. If the gap bypasses 24 hours, the streak harshly resets back to `1`.
- **Achievements Framework**: The `achievements` state tracks milestone objects mapping keys like `xpReward`, `progress`, and `maxProgress`. The hierarchy ranges from "Streak" modifiers (e.g., *Week Warrior*) to "Speed" constraints. Each time a goal finishes, the `checkAchievements()` cascade checks constraints. When matched, `unlockAchievement` assigns the localized timestamp and populates the notification interface.

### 13.2 Real-time Charts & Analytics System
- **Recharts Integration**: The `DashboardPage.tsx` drops vanilla DOM manipulation in favor of the `recharts` package mapped heavily against real UI states.
  - **Progress Over Time (`LineChart`)**: Fed dynamically by an `analyticsData` array, rendering independent variables. The chart uses `#3b82f6` for Progress and `#10b981` tracking direct Goals completed. Render states are customized using mathematical interpolations (`type="monotone"`) preventing jagged corners, fully wrapped with customized hover-tooltips respecting local Dark/Light modes.
  - **Goals Distribution (`PieChart`)**: Maps completion subsets (`goals.filter(g => g.status === "Completed")`). The cells map static Tailwind-complementary Hex colors allowing visually appealing separation on all viewport geometries without hardcoding separate mobile sizes (`<ResponsiveContainer>`).

### 13.3 Animation Ecosystem (`Framer Motion`)
Framer Motion abstracts messy keyframes out of `.css` files relying solely on JSX components.
- **Dashboard Grid Orchestrations**: Parent containers leverage `staggerChildren`, ensuring goals snap, fade, and structurally align incrementally one after another (staggering at varying delays like `delay: idx * 0.1` methodology) instead of an instant flash.
- **3D Responsive Cards**: To mimic physical flashcards, Dashboard goals exploit Framer's viewport modifications leveraging `perspective: "1000px"` and `whileHover={{ rotateY: 5, scale: 1.02, boxShadow: "..." }}` generating stunning interactive 3D illusions while browsing.
- **Ambient Glowing Elements (`HomePage.tsx`)**: Giant SVG blobs colored deeply via Tailwind (`bg-purple-900 blur-3xl`) are mapped into `repeat: Infinity` loops translating diagonally across coordinate bounds (`x: [0, 40, 0]`) reproducing continuous particle-style backgrounds without the high VRAM overhead of Three.js scenes.

### 13.4 Special Effects & Micro-interactions
- **Confetti Event Cycle**: Found deep within `AchievementModal.tsx`, the webapp intercepts state payloads containing the `react-confetti` module. Every single time an achievement pop-up initializes with a newly populated `unlockedAt` timestamp, 200 physical confetti-pieces rain down the DOM spanning the exact coordinates of `window.innerWidth/innerHeight` until decay removes them natively (`recycle={false}`).
- **Hot-Toast Feedback Systems**: Relying on `react-hot-toast` to handle basic notifications. Success flashes drop down unobtrusively rather than utilizing restrictive `window.alert()` locks.
- **SVG Layer Renderings (`HomePage.tsx`)**: High definition trailing wave components sit cleanly at the footer bottom, drawn using 3 distinct `<path>` elements using precise vector bezier points with overlapping opacity modifications to convey depth logic.

### 13.5 AI Extraction Cycle (`SyllabusToGoalsModal.tsx`)
- **PDF Extraction Module**: Leverages `pdfjs-dist` to rip uncompressed text payloads actively off user-dropped documents natively within the browser avoiding sending user-files raw out into backend domains directly.
- **Goal Mapping Abstraction (`useGenerateGoalsAI.ts`)**: Replaces normal input prompts by wrapping the extraction blob and forwarding it cleanly stringified into Native GPT-3.5 prompt-engineered backend wrappers enforcing consistent parameter schemas (Yielding fixed schemas of `Difficulty`, `TimeEstimate`, and `Prerequisites` for the React components to paint elegantly upon return).
