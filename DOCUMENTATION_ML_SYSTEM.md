# LearnTrack ML Integration & RAG Architecture

This documentation covers the newly integrated AI features: Python ML Service, PDF OCR Extractor, and the Context-Aware Chatbot (Doubt Solver).

## 1. Overview
The LearnTrack application now has an independent local Python ML Service. Its purpose is to chunk long PDF texts, vectorize them into dense embeddings, and run a Retrieval-Augmented Generation (RAG) loop alongside OpenAI for syllabus-aware question answering.

## 2. Tech Stack Setup
### Frontend
- `tesseract.js`: Browser-native OCR capabilities for scanned/image-based PDFs.
- `framer-motion`: Chat Panel animations.
### Python ML Service
- `FastAPI`: High-performance asynchronous microservice interface.
- `sentence-transformers`: Local zero-cost NLP embeddings (using `all-MiniLM-L6-v2`).
- `chromadb`: In-memory and persistent vector store for similarity search.

---

## 3. Core Architecture
### A. PDF Extraction Pipeline
1. **User interaction:** A user uploads a PDF inside the "Syllabus to Goals" modal.
2. **Text Parsing (`pdfjs-dist`):** Extracts digital text vectors directly.
3. **OCR Fallback (`tesseract.js`):** If the PDF consists solely of images or scanned content, `tesseract.js` intercepts, renders the pages to a Canvas, and extracts visible text natively in the browser.
4. **Token Control:** Processed text is cleaned of white space and hard-limited to 15,000 characters to prevent crashing OpenAI max_token limits.
5. **Goal Generation:** The text is sent to the Node backend (`/api/generate-goals`). Node returns a strict `json_object` format to prevent parsing flaws.
6. **Vector Buffer Hook:** In the background, the Node backend forwards the text silently to the Python service `/store`.

### B. Machine Learning Service (Python FastAPI)
* **Start command:** `uvicorn main:app --reload` (Runs on `localhost:8000`)
* **`/store` Endpoint:**
  - Tokenizes the syllabus text into multi-sentence chunks.
  - Converts text into numerical vectors using SentenceTransformers.
  - Stores the chunks permanently in local ChromaDB memory.
* **`/query` Endpoint:**
  - Receives a user's question.
  - Converts the question to a vector.
  - Mathematically searches (Cosine Similarity/L2 distance) the database.
  - Returns the top 3 most relevant textual chunks to construct 'AI Context'.

### C. The Doubt-Solver Chatbot
1. User types a question into the floating `ChatPanel`.
2. UI calls Node Express backend at `/api/chat`.
3. Node Express backend halts and issues a `/query` request to Python FastAPI, retrieving the semantic context string.
4. Node constructs a System Prompt interpolating the `context` string.
5. Node calls OpenAI with the RAG prompt.
6. OpenAI guarantees a perfectly contextual answer directly tailored to the user's uploaded documents.

---

## 4. How to Run Locally 
1. **Node Server:** Standard `npm run dev` in UI and `node index.js` in `/backend`.
2. **ML Server:**
   ```bash
   cd ml_service
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

## 5. Limitations & Future Improvements
- **Security:** Vector DB is unauthenticated right now, meaning any system can index into the ChromaDB vector tables. In production, use standard JWT guards on the Python service.
- **Session Isolation:** Currently, the semantic vectors drop into a global pool. Advanced iterations should tag the ChromaDB metadatas with `user_id` so searches don't cross boundaries into other students' syallabus caches.
