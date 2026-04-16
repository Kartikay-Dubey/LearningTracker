# LearnTrack — Complete System Documentation

> Developer reference for the RAG pipeline, goal lifecycle, XP system, quiz validation, and full data flow.

---

## 1. System Architecture

```
Frontend (React + Vite + Zustand)
    │
    ├── Dashboard ──► Goals CRUD (Zustand localStorage)
    │                    │
    │                    ├── Status: To Do → In Progress → Quiz → Completed (LOCKED)
    │                    └── Progress: auto-calculated from subtask completion
    │
    ├── Quiz Modal ──► POST /api/generate-quiz ──► Node Backend
    │                                                 │
    │                                                 ├── Query ML Service (FAISS context)
    │                                                 └── Call OpenRouter (generate 5 MCQs)
    │
    ├── Chat Panel ──► POST /api/chat ──► Node Backend
    │                                        │
    │                                        ├── Query ML (FAISS)
    │                                        ├── Build prompt + context
    │                                        └── Call OpenRouter → sanitize → return
    │
    └── Syllabus Upload ──► POST /api/generate-goals ──► Node Backend
                                                            │
                                                            ├── Call OpenRouter (goal JSON)
                                                            └── Fire-and-forget: POST /store to ML
```

---

## 2. Dashboard Metrics (Explained)

### Stat Cards

| Metric | Formula | Source |
|--------|---------|--------|
| **Total Goals** | `goals.length` | Zustand store |
| **In Progress** | `goals.filter(status === 'In Progress').length` | Zustand store |
| **Completed** | `goals.filter(status === 'Completed').length` | Zustand store |
| **Success Rate** | `Math.round((completed / total) × 100)` | Derived |

### Stat Subtexts (Previously Hardcoded)

The green percentage values (+12%, +5%, etc.) were **previously hardcoded** with no data behind them. They are now replaced with:

| Stat | New Subtext | Logic |
|------|-------------|-------|
| Total Goals | `"8 total"` | Actual count |
| In Progress | `"2 overdue"` or `"On track"` | Checks deadline vs current date |
| Completed | `"4 done"` | Actual count |
| Success Rate | `"50%"` | Same as value |

---

## 3. Goal Lifecycle (State Machine)

```
    ┌──────────┐     ┌─────────────┐     ┌───────┐     ┌───────────┐
    │  To Do   │────►│ In Progress │────►│ Quiz  │────►│ Completed │
    └──────────┘     └─────────────┘     └───────┘     └───────────┘
         │                 ▲                 │               🔒
         │                 │    score < 80%  │          (LOCKED)
         │                 └─────────────────┘
         │
         └── Auto-transitions to "In Progress" when first subtask is checked
```

### Rules

1. **To Do → In Progress**: Manual dropdown OR auto on first subtask check
2. **In Progress → Completed**: ONLY via quiz (80% pass rate, 4/5 questions)
3. **Completed → anything**: ❌ BLOCKED — `updateGoal()` silently rejects
4. **Dropdown**: No "Completed" option — only "To Do" and "In Progress"
5. **Completed goals**: Show locked badge with 🔒 icon instead of dropdown

### Progress Bar (Dynamic)

Progress is automatically recalculated when subtasks are toggled:
```
progress = Math.round((completedSubtasks / totalSubtasks) × 100)
```

If a goal has no subtasks, progress stays at 0% until quiz completion sets it to 100%.

---

## 4. XP System (Redesigned)

### XP Award Table

| Action | XP Awarded |
|--------|-----------|
| Complete an **Easy** goal | +50 |
| Complete a **Medium** goal | +100 |
| Complete a **Hard** goal | +150 |
| Unlock an achievement | +achievement.xpReward |

### Level Formula
```
level = Math.floor(totalXP / 1000) + 1
```

### XP Recalculation

On dashboard mount, `recalculateXP()` runs once to fix corrupted localStorage:
```
correctXP = Σ(completed goals × difficultyXP) + Σ(unlocked achievements × achievementXP)
```

This overwrites any accumulated errors from the pre-fix era.

### Duplicate Prevention (3 layers)

1. **Frontend**: `updateGoal()` checks `prevGoal.status !== 'Completed'` before awarding XP
2. **Frontend**: `unlockAchievement()` checks `!existing.unlockedAt` before awarding bonus XP
3. **Database**: `goal_progress` table has `UNIQUE(goal_id)` constraint — double-completion raises exception

---

## 5. Quiz System

### Flow

1. User clicks **"Quiz"** button on an In Progress goal
2. `QuizModal` opens and calls `POST /api/generate-quiz`
3. Backend:
   - Fetches ML context via `POST /query` with goal title (FAISS)
   - If ML context empty, falls back to goal description
   - Sends context to OpenRouter with MCQ generation prompt
   - Returns `{ questions: [{ question, options, correct }] }`
4. User answers 5 questions one at a time
5. Score calculated: if ≥ 4/5 (80%) → `completeGoalViaQuiz()` is called
6. Store marks goal as Completed, awards difficulty-based XP, updates streak and achievements

### API: `POST /api/generate-quiz`

**Request:**
```json
{
  "goalTitle": "Operating System Components",
  "goalDescription": "Learn about processes, memory management..."
}
```

**Response:**
```json
{
  "questions": [
    {
      "question": "What is a process in an operating system?",
      "options": [
        "A) A hardware component",
        "B) An instance of a running program",
        "C) A type of memory",
        "D) A file system"
      ],
      "correct": "B"
    }
  ]
}
```

---

## 6. Achievement System

### Definitions

| ID | Title | Trigger | Max | XP |
|----|-------|---------|-----|-----|
| first-goal | First Steps | Complete 1 goal | 1 | 50 |
| complete-5 | Goal Getter | Complete 5 goals | 5 | 200 |
| complete-25 | Goal Guru | Complete 25 goals | 25 | 500 |
| complete-100 | Goal Grandmaster | Complete 100 goals | 100 | 2000 |
| streak-3 | Getting Started | 3-day streak | 3 | 100 |
| streak-7 | Week Warrior | 7-day streak | 7 | 250 |
| streak-30 | Monthly Master | 30-day streak | 30 | 1000 |
| streak-100 | Century Champion | 100-day streak | 100 | 5000 |
| speed-demon | Speed Demon | Complete within 24h | 1 | 300 |
| early-bird | Early Bird | Complete before 8 AM | 1 | 150 |
| night-owl | Night Owl | Complete after 10 PM | 1 | 150 |
| perfect-week | Perfect Week | 7 consecutive daily completions | 7 | 750 |

### Unlock Logic

1. `checkAchievements()` runs after every goal completion
2. Scans all achievements, calculates current progress from state
3. If `progress >= maxProgress` AND `!unlockedAt` → `unlockAchievement()`
4. `unlockAchievement()` sets timestamp + awards bonus XP

### Why XP Mismatch Happens

The original XP system had no guards:
- Changing a goal to "Completed" multiple times → +100 XP each time
- Re-unlocking achievements → duplicate bonus XP
- No recalculation mechanism

Now fixed with:
- Status transition guard (only first `→ Completed` awards XP)
- Achievement unlock guard (`unlockedAt` check)
- `recalculateXP()` on mount corrects any legacy corruption

---

## 7. ML Service (Python — FAISS)

**Location:** `ml_service/main.py` | **Port:** 8000

### Embeddings

Model: `all-MiniLM-L6-v2` (384-dim, L2-normalized)

### `POST /store`
Ingests document text → splits into chunks → encodes → adds to FAISS index.

### `POST /query`
Encodes query → searches FAISS for top-N nearest neighbors → returns joined text.

### Important Caveats
- **In-memory only** — FAISS index is lost on restart
- **No user isolation** — all users share one vector store
- Model loads lazily in background thread on first request

---

## 8. Backend Flow (Node.js)

**Location:** `backend/index.js` | **Port:** 5001

### OpenRouter Config
```
baseURL: "https://openrouter.ai/api/v1"
model:   "mistralai/mistral-7b-instruct-v0.1"
apiKey:  OPENROUTER_API_KEY (from .env)
```

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/generate-goals` | Parse syllabus → return goal JSON |
| POST | `/api/chat` | RAG-powered doubt solver |
| POST | `/api/generate-quiz` | Generate 5 MCQs for goal validation |

### Response Sanitizer
Applied only to `/api/chat` responses:
- `## Heading` → `**Heading**`
- Triple+ asterisks → double
- Stray `*` → `•`
- Dash bullets → `•`
- Excessive blank lines collapsed

---

## 9. Database Schema (Supabase/PostgreSQL)

### Tables

| Table | Purpose |
|-------|---------|
| `users` | Profile extending auth.users |
| `goals` | Learning goals with status, difficulty, deadline |
| `goal_progress` | Completion receipts (UNIQUE per goal — prevents double XP) |
| `user_xp` | Aggregated XP, level, streak (1:1 with users) |
| `achievements` | Achievement definitions (seeded once) |
| `user_achievements` | Per-user progress (UNIQUE per user+achievement) |
| `syllabus_imports` | PDF upload audit trail |
| `quiz_attempts` | Every quiz taken (score, questions, pass/fail) |

### Atomic Completion RPC: `complete_goal(goal_id, user_id)`

Server-side function that atomically:
1. Locks the goal row (FOR UPDATE)
2. Checks not already completed
3. Calculates difficulty-based XP
4. Inserts completion receipt
5. Updates XP + streak
6. Updates all achievement progress
7. Auto-unlocks maxed achievements + awards bonus XP
8. Returns full updated state as JSONB

Double-completion is impossible due to `UNIQUE(goal_id)` on `goal_progress`.

---

## 10. Difficulty & Time Estimation

### How Difficulty Is Set
- **AI-generated goals**: The OpenRouter prompt instructs `"difficulty": "Easy" // or Medium, Hard`. The AI infers difficulty from topic complexity.
- **Manual goals**: Default to "Medium". User can customize later.

### XP Mapping
```
Easy   → 50 XP
Medium → 100 XP
Hard   → 150 XP
```

### Estimated Time
Set by the AI based on topic scope. Stored in goal notes as metadata string (e.g., "Estimated Time: 10 hours").

---

## 11. Deadline System

### How It Works
- Goals can have a `deadline` field (ISO date string)
- On dashboard mount, `checkDeadlines()` runs
- UI shows a red "⚠ Overdue" badge on non-completed goals past their deadline
- The "In Progress" stat card shows count of overdue goals

### No Auto-Fail
Overdue goals are **not** automatically failed or penalized. The badge serves as a visual warning. Implementing streak penalties for missed deadlines is a future enhancement.

---

## 12. Running Locally

```bash
# 1. ML Service (Python)
cd ml_service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Backend (Node)
cd backend
npm install
node index.js          # runs on port 5001

# 3. Frontend (Vite)
cd ..
npm install
npm run dev            # runs on port 5173
```

### Environment Variables
- `backend/.env` → `OPENROUTER_API_KEY`, `PORT`, `ML_API_URL`
- Root `.env` → `VITE_API_URL`, Supabase keys

---

## 13. Important Notes

- **FAISS is ephemeral** — restart = data loss. Re-upload PDFs.
- **No user isolation in ML** — shared vector store across all users.
- **Chat history is session-only** — page refresh clears it.
- **Zustand persist** — all goals/XP/achievements stored in `localStorage` key `learning-tracker-storage`.
- **Supabase schema is deployed** but the app currently reads/writes from localStorage only. DB migration is a future phase.
