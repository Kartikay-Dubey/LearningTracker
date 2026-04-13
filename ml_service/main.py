import os
import logging
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss
import threading

# ------------------ CONFIG ------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LearnTrack ML RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ GLOBALS ------------------

embedder = None
model_loading = False

# ------------------ MODEL LOADER ------------------

def load_model_background():
    global embedder, model_loading
    if embedder is None and not model_loading:
        model_loading = True
        logger.info("🔄 Loading model in background...")
        embedder = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ Model loaded successfully")

def get_model():
    global embedder

    if embedder is None:
        # Trigger background loading
        threading.Thread(target=load_model_background).start()
        raise HTTPException(status_code=503, detail="Model is loading, try again in a few seconds")

    return embedder

# ------------------ FAISS ------------------

EMBEDDING_DIM = 384
index = faiss.IndexFlatL2(EMBEDDING_DIM)
documents = []

# ------------------ REQUEST MODELS ------------------

class StoreRequest(BaseModel):
    document_text: str
    metadata: dict = {}

class QueryRequest(BaseModel):
    query: str
    n_results: int = 5

# ------------------ ROUTES ------------------

@app.get("/")
def health_check():
    return {
        "status": "ML Service Running 🚀",
        "indexed_chunks": index.ntotal
    }

# ------------------ STORE ------------------

@app.post("/store")
async def store_document(request: StoreRequest):
    try:
        model = get_model()

        raw_text = request.document_text.strip()

        if not raw_text:
            raise HTTPException(status_code=400, detail="Empty document")

        chunks = [c.strip() for c in raw_text.split('\n\n') if len(c.strip()) > 20]

        if not chunks:
            chunks = [c.strip() for c in raw_text.split('.') if len(c.strip()) > 20]

        if not chunks:
            return {"status": "skipped"}

        embeddings = model.encode(chunks)
        embeddings = np.array(embeddings).astype("float32")

        faiss.normalize_L2(embeddings)

        index.add(embeddings)
        documents.extend(chunks)

        return {
            "status": "success",
            "chunks": len(chunks)
        }

    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))

# ------------------ QUERY ------------------

@app.post("/query")
async def query_context(request: QueryRequest):
    try:
        model = get_model()

        if index.ntotal == 0:
            return {"context": ""}

        query_emb = model.encode([request.query])
        query_emb = np.array(query_emb).astype("float32")

        faiss.normalize_L2(query_emb)

        D, I = index.search(query_emb, min(request.n_results, index.ntotal))

        results = [documents[i] for i in I[0] if i < len(documents)]

        return {"context": "\n\n".join(results)}

    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=str(e))