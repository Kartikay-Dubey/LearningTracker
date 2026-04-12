import os
import uuid
import logging
import json
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import faiss

ML_API_URL = os.getenv("ML_API_URL", "http://localhost:8000")

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

logger.info("Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2')
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 standard dimension
logger.info("Model loaded.")

# Initialize Faiss Index and Document Cache
index = faiss.IndexFlatL2(EMBEDDING_DIM)
documents = []

class StoreRequest(BaseModel):
    document_text: str
    metadata: dict = {}

class QueryRequest(BaseModel):
    query: str
    n_results: int = 5

@app.post("/store")
async def store_document(request: StoreRequest):
    """
    Chunks document and indexes it into FAISS.
    """
    try:
        raw_text = request.document_text.strip()
        if not raw_text:
            raise HTTPException(status_code=400, detail="Empty document text")
            
        chunks = [chunk.strip() for chunk in raw_text.split('\n\n') if len(chunk.strip()) > 20]
        if not chunks:
            chunks = [chunk.strip() for chunk in raw_text.split('.') if len(chunk.strip()) > 20]
            
        if not chunks:
            return {"status": "skipped", "message": "No meaningful chunks extracted"}

        embeddings = embedder.encode(chunks)
        faiss.normalize_L2(embeddings)
        
        index.add(embeddings)
        documents.extend(chunks)
        
        return {"status": "success", "chunks_stored": len(chunks)}
    except Exception as e:
        logger.error(f"Error storing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_context(request: QueryRequest):
    """
    Finds nearest chunks using FAISS.
    """
    try:
        if index.ntotal == 0:
            return {"context": ""}

        query_emb = embedder.encode([request.query])
        faiss.normalize_L2(query_emb)
        
        D, I = index.search(query_emb, min(request.n_results, index.ntotal))
        
        results = [documents[i] for i in I[0] if i < len(documents)]
        context_string = "\n\n".join(results)
        
        return {"context": context_string}
        
    except Exception as e:
        logger.error(f"Error querying context: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "ML Service Operational", "indexed_chunks": index.ntotal}
