# LearnTrack AI & ML Chatbot System Architecture

## 1. System Overview
The LearnTrack application encompasses a fully functional context-aware Retrieval-Augmented Generation (RAG) system. This module solves two primary learning challenges:
1. **Automated Goal Extraction**: It ingests comprehensive, highly-structured academic or professional Syllabus PDFs and intelligently parses them into structured learning modules.
2. **Context-Aware Doubt Solving**: It integrates a unified Chatbot that is inherently "syllabus-aware," allowing users to instantly ask educational questions specifically constrained to their uploaded documents.

---

## 2. Architecture & Data Flow

The architecture operates locally using an integrated pipeline spanning Python and Node.js.

```text
[ User Uploads Syllabus PDF ]
          |
          v
[ React Frontend (pdfjs-dist + Tesseract.js) ] -> Extracts & cleans flat text
          |
          | (POST /api/generate-goals)
          v
[ Node.js Backend Framework ]
          |
          +--> [ ML Service Buffer (POST /store) ] -> (Python) Vectorizes & Caches to Faiss CPU index
          |
          v
[ OpenAI GPT-4 API ] -> Forwards JSON instructions to LLM
          |
          v
[ React Frontend ] -> Renders Smart Goals locally into Dashboard UI

============================================================

[ User Types Question in ChatPanel ]
          |
          | (POST /api/chat)
          v
[ Node.js Backend Framework ]
          |
          | (POST /query) -> Requests Semantic Match
          v
[ Python ML Service (Faiss CPU) ] -> Matches Cosine similarity inside Document Space
          |
          v
[ Node.js Backend ] -> Injects returned Syllabus Strings into System Prompt
          |
          v
[ OpenAI GPT-4 API ] -> Formulates precise educational response
          |
          v
[ ChatPanel UI ] -> Displays Syllabus-Aware response
```

---

## 3. Technologies Used

**Frontend (React + Vite)**
- `pdfjs-dist`: Native PDF vector mapping text extraction.
- `tesseract.js`: Browser-native WASM implementation for OCR analysis of Scanned PDFs.
- `Zustand`: Global state tracking.
- `TailwindCSS`: Floating, adaptive, dark-mode aware UI rendering.

**Backend (Node Express)**
- `Express`: Main orchestration HTTP bridge.
- `OpenAI SDK`: Model integration.

**Machine Learning Service (Python)**
- `FastAPI`: High-speed local microservice routing.
- `Sentence-Transformers`: Advanced NLP embeddings model (`all-MiniLM-L6-v2`).
- `Faiss-CPU`: Meta's ultra-dense L2 similarity local Vector Store.

---

## 4. ML System Explanation
The ML system bypasses traditional databases by storing semantic weight natively in RAM.

- **Embeddings:** When text is sent to the `/store` endpoint, it's chunked by sentence groupings and pushed through `all-MiniLM-L6-v2`. This generates a 384-dimension numerical array (Vector) representing the innate "meaning" of that document segment.
- **Vector Database (Faiss):** Meta's `faiss-cpu` is used because it runs generically across all operating systems without requiring C++ compilers (unlike older versions of ChromaDB). The vectors are indexed using an `IndexFlatL2` matrix.
- **Retrieval Logic:** When the user enters a question, the query string is converted into identical 384-dimension weights. Faiss runs geometric distance formulas (L2 Normalization) against the entire index, returning the closest mathematical matches—which equates to the highest textual relevance.

---

## 5. PDF Processing Pipeline
Instead of relying solely on generic text extractors which crash on scanned images, the frontend has a powerful multi-stage safety net:
1. **Extraction attempt:** `pdfjs-dist` attempts algorithmic layout extraction.
2. **OCR Fallback:** If the PDF returns a text boundary representing purely images/scans (`text.trim() === ""`), `tesseract.js` intercepts. It draws the PDF across an invisible HTML `<canvas>`, scans the image data natively, and transcribes visual data to text.
3. **Cleaning:** The final raw text is stripped of double-spacing and clipped down to `15,000` maximum constraints to prevent crashing external LLM Token Limits.
 
---

## 6. Chatbot System
The `<ChatPanel />` is an absolute-positioned floating layer embedded at the application root (`App.tsx`). This allows the user to access Syllabus guidance independently of what tab they evaluate.
When users submit questions, the Node Backend forces the ML Service to inject the top 3 most relevant textual document chunks directly into OpenAI's hidden context parameters. This creates a firewall that keeps outputs grounded exactly within syllabus scope rather than random internet hallucinations.

---

## 7. API Routing References

### Node Backend Routes (`port 5001`)
- `POST /api/generate-goals`: Expects `{ syllabusText }`. Returns JSON-encoded object arrays.
- `POST /api/chat`: Expects `{ query, history }`. Retrieves contextual buffers and maps LLM completion responses.

### Python ML Routes (`port 8000`)
- `POST /store`: Expects `{ document_text }`. Triggers internal Faiss matrix updates.
- `POST /query`: Expects `{ query, n_results }`. Returns `{ context }` strings containing exact chunk matches.

---

## 8. Setup & Execution Guide

The system uses parallel localized processing. Ensure both services are booted:

**1. Launch the UI & Node Backend**
```bash
# Terminal 1: Root Project
npm run dev

# Terminal 2: Node Express Backend
cd backend
npm run dev
```

**2. Launch the ML RAG Pipeline**
```bash
# Terminal 3: Machine Learning Service
cd ml_service

# Activate Environment (Windows example)
.\venv\Scripts\Activate.ps1

# Start FastAPI
py -m uvicorn main:app --reload --port 8000
```
*(Verify health checks at `localhost:8000/docs`)*

---

## 9. Current Limitations & Edge Cases
- **Volatile Storage:** Currently, `faiss-cpu` holds indexes in generic memory space. Rebooting the `FastAPI` instance clears the document cache. A persistence layer (e.g. `faiss.write_index`) should be integrated for production deployaments.
- **Context Bleed:** Because indexes do not inherently track `{ user_id }` metadata mappings against Faiss tables right now, running this natively in production could crosscontaminate multiple students uploading different PDFs across concurrent sessions.

---

## 10. Future Improvements
1. **User Segregation Indexing:** Move away from unified `IndexFlatL2` to filtered metadata structures (like `lancedb` or persistent user-scoped collections) to keep individual student profiles clean.
2. **Async OCR:** `Tesseract.js` takes large CPU cycles on the main thread for >5 page documents. Shift this routine directly into Web Workers to prevent frame drops in the React Render tree.
3. **Optimized Embedders:** While `MiniLM` is fast, exploring ONNX Runtime accelerated models could yield even faster localized embeddings for minimal CPU stress.
