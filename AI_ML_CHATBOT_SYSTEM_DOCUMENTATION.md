# LearnTrack — AI / ML / Chatbot System Documentation

> Developer reference for the RAG pipeline, goal generation engine, XP system, and full data flow.

---

## 1. System Architecture (High Level)

```
Frontend (React + Vite)
    │
    ├── Chat Panel ──► POST /api/chat ──► Node Backend
    │                                        │
    │                                        ├── 1. Query ML Service (FAISS)
    │                                        │       POST http://127.0.0.1:8000/query
    │                                        │       ← returns relevant context chunks
    │                                        │
    │                                        ├── 2. Build prompt (system + context + history)
    │                                        │
    │                                        └── 3. Call OpenRouter (Mistral 7B)
    │                                                ← returns AI answer
    │                                                → sanitize response
    │                                                → return to frontend
    │
    └── Syllabus Upload ──► POST /api/generate-goals ──► Node Backend
                                                            │
                                                            ├── Call OpenRouter (goal JSON)
                                                            └── Fire-and-forget: POST /store
                                                                  to ML service (index syllabus)
```

---

## 2. ML Service (Python — FAISS)

**Location:** `ml_service/main.py`
**Framework:** FastAPI
**Port:** 8000

### How FAISS Works

FAISS (Facebook AI Similarity Search) is an in-memory vector database. It stores numerical representations (embeddings) of text chunks and lets you find the most similar chunks to a given query using L2 distance.

**Key point:** FAISS is purely in-memory. All indexed data is lost on service restart. There is no disk persistence configured.

### How Embeddings Are Created

The service uses the `all-MiniLM-L6-v2` model from the `sentence-transformers` library.

• Model output dimension: **384 floats** per chunk
• Embeddings are L2-normalized before indexing (`faiss.normalize_L2`)
• The model loads lazily in a background thread on first request

### Endpoints

#### `POST /store`

Ingests a document into the FAISS index.

**Request body:**
```json
{
  "document_text": "Full text content of the PDF/syllabus...",
  "metadata": {}
}
```

**Processing steps:**
1. Split text by double newlines (`\n\n`) into chunks (min 20 chars)
2. Fallback: split by period if paragraph splitting yields nothing
3. Encode all chunks → 384-dim vectors
4. Normalize and add to FAISS index
5. Store raw chunk text in a parallel `documents[]` array

**Response:** `{ "status": "success", "chunks": 15 }`

#### `POST /query`

Retrieves the most relevant context chunks for a user question.

**Request body:**
```json
{
  "query": "What are the types of operating systems?",
  "n_results": 3
}
```

**Processing steps:**
1. Encode the query → 384-dim vector
2. Normalize the query vector
3. Search FAISS index for top-N nearest neighbors
4. Map index positions back to raw text in `documents[]`
5. Join results with double newlines

**Response:** `{ "context": "chunk1\n\nchunk2\n\nchunk3" }`

---

## 3. Backend Flow (Node.js)

**Location:** `backend/index.js`
**Framework:** Express.js
**Port:** 5001

### OpenRouter Integration

The backend uses the `openai` npm package pointed at OpenRouter's base URL:

```
baseURL: "https://openrouter.ai/api/v1"
model:   "mistralai/mistral-7b-instruct-v0.1"
```

The API key is read from `OPENROUTER_API_KEY` in `backend/.env`.

### Chatbot Flow (`POST /api/chat`)

1. **Receive** user query + chat history from frontend
2. **Semantic search** → call ML service `POST /query` with the user's question
3. **Build prompt** → system prompt includes formatting rules + retrieved context
4. **Call OpenRouter** → sends `[system, ...history, user]` messages array
5. **Sanitize** → strip `##` headings, excessive `**`, normalize bullets
6. **Return** clean response to frontend

### Goal Generation Flow (`POST /api/generate-goals`)

1. **Receive** extracted syllabus text from frontend
2. **Call OpenRouter** with a structured system prompt demanding raw JSON output
3. **Parse** the AI response (expects `{ "goals": [...] }`)
4. **Fire-and-forget** → silently POST the syllabus text to ML `/store` endpoint so future chatbot queries have context
5. **Return** goals JSON to frontend

### Response Sanitizer

Applied only to chat responses (not goal generation). Rules:
• `## Heading` → `**Heading**` (converts markdown headings to bold)
• Triple+ asterisks → double asterisks
• Empty bold markers `** **` → removed
• Stray single `*` → bullet `•`
• Dash bullets `- item` → `• item`
• Excessive blank lines collapsed

---

## 4. Goal System

### How Goals Are Generated

1. User uploads a PDF via the Syllabus-to-Goals modal
2. Frontend extracts text using `useExtractTextFromPDF` hook
3. Text is sent to `POST /api/generate-goals`
4. AI returns structured JSON with fields:
   - `title` — module/topic name
   - `description` — what to learn
   - `difficulty` — Easy / Medium / Hard
   - `estimated_time` — time estimate
   - `prerequisites` — dependency list
   - `resources` — links or book names
5. Frontend parses JSON and calls `addGoal()` for each entry

### How Difficulty Is Estimated

Difficulty is determined entirely by the AI model based on the syllabus content. The prompt instructs: `"difficulty": "Easy" // or Medium, Hard`. The AI infers difficulty from the complexity of the topic description.

### Goal IDs

Each goal gets a unique ID: `Date.now() + random alphanumeric suffix`. This prevents collisions when bulk-creating goals from AI output in rapid succession.

---

## 5. XP & Progression System

**Location:** `src/stores/useStore.ts` (Zustand store with `persist` middleware)

### XP Calculation

| Action | XP Awarded |
|--------|-----------|
| Complete a goal | +100 XP |
| Unlock an achievement | +achievement.xpReward |

### Level Formula

```
level = Math.floor(totalXP / 1000) + 1
```

Every 1000 XP = 1 level up.

### Streak System

Tracked via `lastActivityDate` in user stats:
• **Same day** activity → streak unchanged
• **Next day** activity → streak incremented by 1
• **Gap > 1 day** → streak resets to 1

`longestStreak` is always updated to `max(current, longest)`.

### XP Guard (Duplicate Prevention)

Before awarding XP on goal completion, the store checks:
```
const wasAlreadyCompleted = prevGoal?.status === 'Completed';
if (updates.status === 'Completed' && !wasAlreadyCompleted) {
  addXP(100);  // Only fires on genuine transition
}
```

This prevents double XP when:
- Re-selecting "Completed" on an already-completed goal
- React re-renders triggering duplicate state updates

---

## 6. Achievements System

### Achievement Types

| Category | Examples |
|----------|---------|
| milestone | First Steps (1 goal), Goal Getter (5), Goal Guru (25), Grandmaster (100) |
| streak | Getting Started (3d), Week Warrior (7d), Monthly Master (30d), Century (100d) |
| speed | Speed Demon (complete goal within 24h of creation) |
| consistency | Perfect Week (1 goal/day for 7 days) |
| special | Early Bird (before 8 AM), Night Owl (after 10 PM) |

### Rarity Tiers

`common` → `rare` → `epic` → `legendary`

### Unlock Logic

`checkAchievements()` runs after every goal add/complete. It:
1. Counts completed goals and current streak
2. Updates `progress` on each achievement
3. If `progress >= maxProgress` and not yet unlocked → calls `unlockAchievement()`
4. `unlockAchievement()` sets `unlockedAt` timestamp and awards bonus XP

---

## 7. Frontend Data Flow

```
User types question in ChatPanel
     │
     ▼
ChatPanel.handleSend()
     │
     ├── Appends user message to local state
     ├── Sends POST /api/chat with { query, history }
     │
     ▼
Backend processes (ML context → OpenRouter → sanitize)
     │
     ▼
ChatPanel receives { choices: [{ message: { content } }] }
     │
     └── Appends assistant message to local state → renders in UI
```

### State Management

- **Cart/Goals/XP/Achievements:** Zustand store (`useStore`) with `persist` middleware (localStorage key: `learning-tracker-storage`)
- **Chat messages:** Local React state inside `ChatPanel` component (not persisted)
- **Auth:** Supabase client (`src/lib/supabaseClient.ts`)

---

## 8. Important Notes & Caveats

**FAISS is in-memory only**
All indexed document chunks are lost when the Python ML service restarts. There is no persistence layer. If you restart `ml_service`, users must re-upload their PDFs.

**No user isolation**
The FAISS index is global. All users share the same vector store. One user's uploaded syllabus will be searchable by another user's chatbot queries.

**Chat history is session-only**
Chat messages live in React component state. Refreshing the page or closing the chat panel clears all conversation history.

**OpenRouter rate limits**
The backend uses Mistral 7B via OpenRouter. Free-tier keys have rate limits. Monitor `429` responses in backend logs.

**Environment variables required:**
- `backend/.env` → `OPENROUTER_API_KEY`, `PORT`, `ML_API_URL`
- Root `.env` or `.env.local` → `VITE_API_URL`

---

## 9. Running the Full Stack Locally

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
cd ..                  # project root
npm install
npm run dev            # runs on port 5173
```

All three services must be running simultaneously for full functionality.
