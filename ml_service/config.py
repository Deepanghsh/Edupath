"""
config.py — ML Service Configuration
Reads from .env file in ml_service/ or falls back to defaults.
"""
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/edupath")
DB_NAME   = os.getenv("DB_NAME", "edupath")
ML_PORT   = int(os.getenv("ML_PORT", 8000))
NODE_URL  = os.getenv("NODE_URL", "http://localhost:5000")

# Paths
import pathlib
BASE_DIR         = pathlib.Path(__file__).parent
SAVED_MODELS_DIR = BASE_DIR / "saved_models"
SAVED_MODELS_DIR.mkdir(exist_ok=True)

# Model file paths
PLACEMENT_MODEL_PATH  = SAVED_MODELS_DIR / "placement_rf.pkl"
RISK_MODEL_PATH       = SAVED_MODELS_DIR / "risk_kmeans.pkl"
RAG_INDEX_PATH        = SAVED_MODELS_DIR / "rag_tfidf.pkl"
