# LearnTrack: Production Features & Architecture Documentation

This document serves as the absolute technical glossary for the LearnTrack dashboard platform, covering its component hierarchies, integrations, visual schemas, and underlying algorithms.

---

## 🏗️ 1. Frontend Architecture

- **Core Framework**: React 18 + Vite (TypeScript)
- **State Management**: **Zustand**. Utilizes a robust bound store (`useStore.ts`) paired with `persist` middleware for caching state strictly in `localStorage` across reloads.
- **Routing System**: `react-router-dom` using declarative client-side mapping.
- **Component Strategy**: Centralized functional patterns. Feature domains are separated inside `src/components/features/...` (e.g., `goals/`, `achievements/`), creating distinct logical isolation.

---

## 🎨 2. UI & Interaction Libraries

- **Styling**: Vanilla Tailwind CSS. Utilizes intense utility compositions (e.g., gradients, opacities, customized backdrop-blurs) to emulate premium "glassmorphic" SaaS interactions.
- **Animations**: Standardized via `framer-motion`. Elements mount via `<AnimatePresence>` for DOM exit transitions and utilize `variants` for nested stagger effects.
- **Charting**: `recharts` maps analytical logic into scalable SVG formats like line progressions and pie distribution metrics.
- **Gamification Touches**: `canvas-confetti` provides real-time client bursts upon hitting milestone triggers.

---

## 📊 3. Dashboard Components Breakdown

### Flow Architecture
Currently, the analytical presentation maps: **Goals Hub → Progress Tracking Over Time → Goal Distribution Analytics → Gamification & Achievements → Static Performance Data**.

#### 🎯 Goals Section
- **Data Source**: Array of `Goal` objects accessed sequentially from the Zustand state.
- **Computation**: Time granularity spans dynamically based on an ISO timestamp (`deadline`). A live comparative algorithm contrasts `createdAt` to `Date.now()` to render a highly accurate, time-based dynamic UI gradient indicating deadline progression (Teal -> Amber -> Red).

#### 📈 Progress Over Time (Line Chart)
- **Data Source**: Recharts `<LineChart>` consuming data derived backward exactly 7 days from `Date.now()`.
- **Computation**: XP generation and total completion volume are dynamically counted by isolating standard timestamps (`completedAt` strings mapped alongside total Goal XP).
- **State Origination**: Computed strictly via `useMemo` hooks mapped within `DashboardPage.tsx` targeting persistent `useStore.ts` variables.

#### 📊 Goals Distribution (Pie Chart)
- **Data Source**: `pieData` array populated from `goals.filter()`.
- **Computation**: Simple arithmetic isolation of `To Do`, `In Progress`, and `Completed` strings. 

#### 🏆 Achievements & Streak System
- **Data Source**: Read-only `userStats` nested object bridging with the `achievements` array definition standard.
- **Computation**: Real-time evaluation loop checks. When goals hit criteria (e.g., completing within 24 hours unlocks 'Speed Demon'), flags flip asynchronously inside Zustand memory.

---

## 🤖 4. AI & ML Integration Mechanics

- **Knowledge Generation Pipeline (RAG)**: Relies on a decentralized micro-service mapped as `process.env.ML_API_URL`.
- **Embedding Intercept**:
  - Python-based sub-server utilizing advanced Sentence Transformers logic caches document chunks via **FAISS** in-memory structures.
- **Chatbot Contextual Injection**:
  - Node.js hits `POST /query` on the local ML layer with `n_results: 5`.
  - Content strings return seamlessly as `context`.
  - Context is then pipelined into OpenRouter's `mistralai/mistral-7b-instruct-v0.1` payload using heavily engineered Prompt Templates, enforcing strict pedagogical JSON constraints or short Markdown snippets.

---

## 🎮 5. XP & Progression Algorithms

- **XP Calculation**: Standard goals provide varying XP rewards per completion. Achievements push lump-sum XP bonuses dynamically.
- **Level Scaling Formula**: The threshold to reach the next level is scaled linearly to keep user friction engaging, checked via: `(level * 100) * 1.5`, allowing the threshold bar to widen.
- **Activity Streak Checks**: Triggers on `DashboardPage` mount. Analyzes the `lastActive` string vs exact Midnight markers. Missing consecutive timestamps defaults streak to `0`.

---

## 🔄 6. Gamification UX Logic

- **Hover & Focus**: Heavy reliance on layered shadows `shadow-[cyan]/30` mapped alongside `hover:-translate-y-1` physics via Tailwind to construct a tactile, lifting UI space on components.
- **Micro-Interactions**: Dropdown clicks and Navigation bars adapt `framer-motion` spring mechanics (`type: spring`, `damping: 20`) to soften harsh transition stutters usually inherent to standard React updates.

---

## 💾 7. Authentication & Data Flows

- **Guest Mode Protocol**: Application defaults into an unrestrained sandbox. Users do not bounce to a restrictive auth portal. Data seamlessly binds into an indexed LocalStore matrix, maintaining their state indefinitely unless purged.
- **Supabase Hybrid Sync**: Real authentication is completely optional. If a token verifies, state hydrates upward via standard PostgreSQL Rest APIs syncing to `supabase.co`. Wait loops ensure large local cached states overwrite upstream records gracefully.
