"""
ml_service/main.py
===================
FastAPI application — EduPath SPIE ML Engine entry point.

Endpoints:
  GET  /health                  → Service + model status
  POST /pipeline/run            → Run SPIE 12-node pipeline for a student
  GET  /pipeline/result/{id}    → Get cached result
  DELETE /pipeline/invalidate/{id} → Clear cache
  POST /ml/predict              → Direct placement prediction (Random Forest)
  GET  /ml/recommend/{id}       → Drive recommendations (TF-IDF cosine)
  GET  /ml/risk/{id}            → Risk assessment (K-Means)
  GET  /ml/skill-gap/{id}       → Skill gap analysis
  POST /ml/train                → Retrain all models
  POST /ocr/extract             → Local OCR — extract CGPA from mark sheet image/PDF
  POST /rag/query               → MongoDB-native RAG query
  POST /rag/index               → Rebuild RAG index

Run with:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import hashlib
from datetime import datetime, timezone, timedelta

# Pipeline
from pipeline.graph import run_pipeline

# Individual ML models
from models.placement_predictor import predict as predict_placement, train as train_placement
from models.drive_recommender   import recommend as recommend_drives
from models.risk_clusterer      import predict as predict_risk, train as train_risk
from models.skill_gap           import analyze as analyze_skill_gap

# RAG
from rag.retriever import build_index, query_index
from rag.answerer  import generate_answer

# OCR — local pytesseract engine (replaces Gemini Vision)
from ocr.extractor import extract_from_bytes, OCR_AVAILABLE

# Data
from data.mongo_loader import get_db, load_students
from config import ML_PORT


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app = FastAPI(
    title       = "EduPath SPIE — Student Placement Intelligence Engine",
    description = (
        "12-node fan-out/fan-in pipeline · 4 ML models · "
        "MongoDB-native RAG · Local pytesseract OCR · No external APIs"
    ),
    version = "1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Health
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.get("/health")
def health():
    from config import PLACEMENT_MODEL_PATH, RISK_MODEL_PATH, RAG_INDEX_PATH
    return {
        "status":  "ok",
        "service": "EduPath SPIE ML Engine",
        "models": {
            "placement_predictor": PLACEMENT_MODEL_PATH.exists(),
            "risk_clusterer":      RISK_MODEL_PATH.exists(),
            "rag_index":           RAG_INDEX_PATH.exists(),
            "ocr_available":       OCR_AVAILABLE,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pipeline Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class PipelineRequest(BaseModel):
    student_id: str

@app.post("/pipeline/run")
def pipeline_run(req: PipelineRequest):
    """Runs the full 12-node SPIE pipeline. Returns cached result if same-day hit."""
    if not req.student_id:
        raise HTTPException(400, "student_id is required")
    return run_pipeline(req.student_id)

@app.get("/pipeline/result/{student_id}")
def pipeline_result(student_id: str):
    """Returns cached pipeline result without re-running."""
    today     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = hashlib.sha256(f"{student_id}:{today}".encode()).hexdigest()
    hit       = get_db().pipeline_cache.find_one({"_id": cache_key})
    if not hit:
        raise HTTPException(404, "No cached result. Run /pipeline/run first.")
    return {**hit.get("result", {}), "cache_hit": True}

@app.delete("/pipeline/invalidate/{student_id}")
def pipeline_invalidate(student_id: str):
    """Clears today's cache — forces full re-run on next call."""
    today     = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cache_key = hashlib.sha256(f"{student_id}:{today}".encode()).hexdigest()
    r         = get_db().pipeline_cache.delete_one({"_id": cache_key})
    return {"deleted": r.deleted_count > 0}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Individual ML Endpoints
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class PredictRequest(BaseModel):
    cgpa:            float
    dsa_marks:       float
    oops_marks:      float
    active_backlogs: int        = 0
    skills:          List[str]  = []

@app.post("/ml/predict")
def ml_predict(req: PredictRequest):
    """Random Forest placement probability prediction."""
    return predict_placement(req.cgpa, req.dsa_marks, req.oops_marks,
                             req.active_backlogs, req.skills)

@app.get("/ml/recommend/{student_id}")
def ml_recommend(student_id: str, top_n: int = 5):
    """TF-IDF cosine drive recommendations ranked by skill match."""
    results = recommend_drives(student_id=student_id, top_n=top_n)
    return {"recommendations": results, "count": len(results)}

@app.get("/ml/risk/{student_id}")
def ml_risk(student_id: str):
    """K-Means risk cluster assignment + training suggestions."""
    df  = load_students()
    row = df[df["_id"] == student_id]
    if row.empty:
        raise HTTPException(404, "Student not found")
    s = row.iloc[0]
    return predict_risk(float(s.get("cgpa", 0)), float(s.get("dsa_marks", 0)),
                        float(s.get("oops_marks", 0)), int(s.get("active_backlogs", 0)),
                        int(s.get("rejection_count", 0)))

@app.get("/ml/skill-gap/{student_id}")
def ml_skill_gap(student_id: str):
    """Skill demand vs. student skills — ranked missing skills."""
    return analyze_skill_gap(student_id=student_id)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OCR Endpoint — Local pytesseract (no external API)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.post("/ocr/extract")
async def ocr_extract(file: UploadFile = File(...)):
    """
    Extracts academic data from a mark sheet image or PDF using pytesseract.

    Accepts: .jpg, .jpeg, .png, .pdf, .webp, .bmp, .tiff
    Returns: { success, extracted: { cgpa, branch, roll_number, backlogs, ... } }

    Processing pipeline:
      Image → Grayscale → Sharpen → Contrast × 2 → Scale to 300 DPI
      → pytesseract LSTM OCR → Regex parser → Structured dict

    The frontend sends the uploaded mark sheet here.
    Extracted CGPA/backlogs auto-populate the student registration form.
    """
    if not OCR_AVAILABLE:
        raise HTTPException(503, "OCR not available. Install pytesseract + Tesseract engine.")

    allowed_ext = {".jpg", ".jpeg", ".png", ".pdf", ".webp", ".bmp", ".tiff"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Allowed: {allowed_ext}")

    file_bytes = await file.read()
    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(413, "File too large. Maximum size is 10 MB.")

    result = extract_from_bytes(file_bytes, file.filename or "upload" + ext)
    if not result["success"]:
        raise HTTPException(422, result.get("error", "OCR processing failed"))

    return result

@app.get("/ocr/status")
def ocr_status():
    """Returns OCR availability and Tesseract engine info."""
    status = {"available": OCR_AVAILABLE}
    if OCR_AVAILABLE:
        try:
            import pytesseract
            status["tesseract_version"] = pytesseract.get_tesseract_version().version
        except Exception as e:
            status["tesseract_error"] = str(e)
    return status


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Training
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.post("/ml/train")
def ml_train(background_tasks: BackgroundTasks):
    """Retrains all ML models on latest MongoDB data (runs in background)."""
    def _train():
        print("\n[Train] Starting...")
        train_placement()
        train_risk()
        build_index()
        print("[Train] ✅ Done")
    background_tasks.add_task(_train)
    return {"message": "Training started in background",
            "models": ["placement_predictor", "risk_clusterer", "rag_index"]}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RAG
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class RAGRequest(BaseModel):
    query:      str
    student_id: Optional[str] = None
    top_k:      int           = 3

@app.post("/rag/query")
def rag_query(req: RAGRequest):
    """MongoDB-native RAG: TF-IDF retrieval + template answer. No LLM."""
    docs   = query_index(req.query, top_k=req.top_k)
    answer = generate_answer(req.query, docs, student_id=req.student_id)
    return {"query": req.query, "answer": answer, "retrieved_docs": docs}

@app.post("/rag/index")
def rag_reindex():
    """Rebuilds the TF-IDF document index from current MongoDB data."""
    return build_index()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Startup: auto-train if models don't exist yet
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.on_event("startup")
def startup_event():
    from config import PLACEMENT_MODEL_PATH, RISK_MODEL_PATH, RAG_INDEX_PATH
    print("\n[Startup] EduPath SPIE ML Engine starting...")
    if not PLACEMENT_MODEL_PATH.exists():
        print("[Startup] Training PlacementPredictor...")
        train_placement()
    if not RISK_MODEL_PATH.exists():
        print("[Startup] Training RiskClusterer...")
        train_risk()
    if not RAG_INDEX_PATH.exists():
        print("[Startup] Building RAG index...")
        build_index()
    print(f"[Startup] ✅ All models ready | OCR={'ON' if OCR_AVAILABLE else 'OFF (install pytesseract)'}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=ML_PORT, reload=True)
