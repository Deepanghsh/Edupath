# -*- coding: utf-8 -*-
import sys, io
# Force UTF-8 output on Windows so box-drawing chars render correctly
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
test_ml.py -- EduPath SPIE Complete Test Suite
================================================
Tests every ML component in two modes:

  MODE 1: DIRECT (no server needed)
    Tests Python modules directly: MongoDB connection, model training,
    pipeline nodes, RAG index, OCR availability.

  MODE 2: HTTP (server must be running on port 8000)
    Hits every FastAPI endpoint and checks responses.

Run:
  python test_ml.py          ← runs both modes
  python test_ml.py --direct ← direct only (no server needed)
  python test_ml.py --http   ← HTTP only (server must be running)

Color output: GREEN = pass, RED = fail, YELLOW = warning/skip
"""

import sys
import os
import time
import json
import argparse

# ── Add ml_service to path ────────────────────────────────────────────────────
ML_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ML_DIR)

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

PASS  = f"{GREEN}✓ PASS{RESET}"
FAIL  = f"{RED}✗ FAIL{RESET}"
SKIP  = f"{YELLOW}⚠ SKIP{RESET}"
INFO  = f"{CYAN}ℹ INFO{RESET}"

results = {"passed": 0, "failed": 0, "skipped": 0}


def test(name: str, fn, skip_if=False, skip_reason=""):
    """Runs a single test function and reports result."""
    if skip_if:
        print(f"  {SKIP}  {name}  ({skip_reason})")
        results["skipped"] += 1
        return None
    try:
        t0  = time.time()
        val = fn()
        ms  = round((time.time() - t0) * 1000, 1)
        print(f"  {PASS}  {name}  [{ms}ms]")
        if val is not None:
            # Print small preview of return value
            preview = str(val)[:120].replace("\n", " ")
            print(f"          → {CYAN}{preview}{RESET}")
        results["passed"] += 1
        return val
    except Exception as e:
        print(f"  {FAIL}  {name}")
        print(f"          → {RED}{type(e).__name__}: {e}{RESET}")
        results["failed"] += 1
        return None


def header(title: str):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'-'*60}{RESET}")


# ══════════════════════════════════════════════════════════════════════════════
# MODE 1 — DIRECT TESTS (no server needed)
# ══════════════════════════════════════════════════════════════════════════════
def run_direct_tests():
    print(f"\n{BOLD}{'='*60}")
    print(f"  MODE 1: DIRECT TESTS  (imports + MongoDB)")
    print(f"{'='*60}{RESET}")

    # ── 1. Config ─────────────────────────────────────────────────────────────
    header("1 · Config & Imports")

    test("Import config.py", lambda: __import__("config") and "OK")

    def check_env():
        from config import MONGO_URI, ML_PORT
        assert "mongodb" in MONGO_URI.lower(), "MONGO_URI missing"
        assert ML_PORT == 8000
        return f"MONGO_URI={'atlas' if 'mongodb+srv' in MONGO_URI else 'local'}, PORT={ML_PORT}"
    test("config.py values loaded", check_env)

    # ── 2. MongoDB Connection ─────────────────────────────────────────────────
    header("2 · MongoDB Connection (PyMongo)")

    def check_mongo():
        from data.mongo_loader import get_db
        db = get_db()
        assert db is not None
        colls = db.list_collection_names()
        return f"Collections: {colls}"
    mongo_ok = test("PyMongo connects to MongoDB", check_mongo)

    def check_students():
        from data.mongo_loader import load_students
        df = load_students()
        assert len(df) > 0, "No students in DB — run: node seed/seed.js"
        return f"{len(df)} students loaded, cols={list(df.columns[:5])}"
    test("load_students() returns data", check_students,
         skip_if=(mongo_ok is None), skip_reason="MongoDB not connected")

    def check_drives():
        from data.mongo_loader import load_drives
        df = load_drives()
        assert len(df) > 0, "No drives in DB"
        return f"{len(df)} drives loaded"
    test("load_drives() returns data", check_drives,
         skip_if=(mongo_ok is None), skip_reason="MongoDB not connected")

    def check_apps():
        from data.mongo_loader import load_applications_with_students
        df = load_applications_with_students()
        return f"{len(df)} labeled applications (Selected/Rejected)"
    test("load_applications_with_students()", check_apps,
         skip_if=(mongo_ok is None), skip_reason="MongoDB not connected")

    def check_stats():
        from data.mongo_loader import load_placement_stats
        s = load_placement_stats()
        assert "total_students" in s
        return s
    test("load_placement_stats()", check_stats,
         skip_if=(mongo_ok is None), skip_reason="MongoDB not connected")

    # ── 3. Placement Predictor (Random Forest) ────────────────────────────────
    header("3 · Placement Predictor  (Random Forest)")

    def train_placement():
        from models.placement_predictor import train
        r = train()
        assert r["test_accuracy"] > 0.5, f"Accuracy too low: {r['test_accuracy']}"
        return r
    placement_ok = test("Train RandomForestClassifier", train_placement)

    def predict_high():
        from models.placement_predictor import predict
        r = predict(cgpa=8.5, dsa_marks=85, oops_marks=88,
                    active_backlogs=0, skills=["Java","React","DSA"])
        assert 0 <= r["confidence"] <= 100
        assert isinstance(r["placed"], bool)
        assert len(r["insights"]) > 0
        return f"placed={r['placed']}, confidence={r['confidence']}%"
    test("Predict: strong student (CGPA 8.5, DSA 85)", predict_high,
         skip_if=(placement_ok is None), skip_reason="Training failed")

    def predict_low():
        from models.placement_predictor import predict
        r = predict(cgpa=5.2, dsa_marks=35, oops_marks=40,
                    active_backlogs=2, skills=["HTML"])
        assert r["confidence"] < 70, "Low-profile student should have lower confidence"
        return f"placed={r['placed']}, confidence={r['confidence']}%"
    test("Predict: weak student (CGPA 5.2, backlogs 2)", predict_low,
         skip_if=(placement_ok is None), skip_reason="Training failed")

    def predict_insights():
        from models.placement_predictor import predict
        r = predict(cgpa=6.0, dsa_marks=45, oops_marks=50,
                    active_backlogs=1, skills=["PHP"])
        assert any("DSA" in i or "CGPA" in i or "backlog" in i for i in r["insights"])
        return f"insights: {r['insights'][:2]}"
    test("Predict: insights are meaningful strings", predict_insights,
         skip_if=(placement_ok is None), skip_reason="Training failed")

    # ── 4. Drive Recommender (TF-IDF) ─────────────────────────────────────────
    header("4 · Drive Recommender  (TF-IDF Cosine Similarity)")

    def get_first_student_id():
        from data.mongo_loader import load_students
        df = load_students()
        if df.empty:
            return None
        return df.iloc[0]["_id"]

    first_id = get_first_student_id() if mongo_ok else None

    def test_recommend():
        from models.drive_recommender import recommend
        results = recommend(student_id=first_id, top_n=5)
        assert isinstance(results, list), "Should return list"
        assert len(results) > 0, "Should return at least 1 recommendation"
        r = results[0]
        assert "match_score" in r, "Should have match_score"
        assert "company_name" in r
        assert 0 <= r["match_score"] <= 100
        return f"{len(results)} recs | top: {r['company_name']} ({r['match_score']}% match, {r['match_label']})"
    test("recommend() returns ranked drives", test_recommend,
         skip_if=(first_id is None), skip_reason="No students in DB")

    def test_recommend_fields():
        from models.drive_recommender import recommend
        results = recommend(student_id=first_id, top_n=3)
        r = results[0]
        required = ["drive_id","company_name","job_role","match_score","match_label","eligible"]
        missing  = [f for f in required if f not in r]
        assert not missing, f"Missing fields: {missing}"
        return f"All required fields present: {required}"
    test("recommend() result has all required fields", test_recommend_fields,
         skip_if=(first_id is None), skip_reason="No students in DB")

    # ── 5. Risk Clusterer (K-Means) ───────────────────────────────────────────
    header("5 · Risk Clusterer  (K-Means Clustering)")

    def train_risk():
        from models.risk_clusterer import train
        r = train()
        assert r["clusters"] == 3
        assert r["samples"] > 0
        return r
    risk_ok = test("Train KMeans (3 clusters)", train_risk)

    def predict_high_risk():
        from models.risk_clusterer import predict
        r = predict(cgpa=5.0, dsa_marks=30, oops_marks=35,
                    active_backlogs=2, rejection_count=3)
        assert r["risk_level"] in ("High Risk","Medium Risk","Low Risk")
        assert len(r["suggestions"]) > 0
        return f"risk={r['risk_level']}, cluster={r['cluster_id']}"
    test("Predict: high-risk student profile", predict_high_risk,
         skip_if=(risk_ok is None), skip_reason="Training failed")

    def predict_low_risk():
        from models.risk_clusterer import predict
        r = predict(cgpa=9.0, dsa_marks=90, oops_marks=92,
                    active_backlogs=0, rejection_count=0)
        assert r["risk_level"] in ("High Risk","Medium Risk","Low Risk")
        return f"risk={r['risk_level']}, suggestions={len(r['suggestions'])}"
    test("Predict: low-risk student profile", predict_low_risk,
         skip_if=(risk_ok is None), skip_reason="Training failed")

    def risk_suggestions():
        from models.risk_clusterer import predict
        r = predict(cgpa=6.5, dsa_marks=60, oops_marks=55, active_backlogs=1)
        assert all(isinstance(s, str) and len(s) > 5 for s in r["suggestions"])
        return f"suggestions: {r['suggestions'][0][:60]}..."
    test("Risk suggestions are non-empty strings", risk_suggestions,
         skip_if=(risk_ok is None), skip_reason="Training failed")

    # ── 6. Skill Gap Analyzer ─────────────────────────────────────────────────
    header("6 · Skill Gap Analyzer  (MongoDB Counter)")

    def test_skill_gap():
        from models.skill_gap import analyze
        r = analyze(student_id=first_id)
        assert "owned_skills" in r
        assert "missing_skills" in r
        assert "coverage_pct" in r
        assert 0 <= r["coverage_pct"] <= 100
        return (f"owned={len(r['owned_skills'])} skills, "
                f"missing={len(r['missing_skills'])}, "
                f"coverage={r['coverage_pct']}%")
    test("analyze() returns skill gap", test_skill_gap,
         skip_if=(first_id is None), skip_reason="No students in DB")

    def test_skill_gap_missing_fields():
        from models.skill_gap import analyze
        r = analyze(student_id=first_id)
        if r["missing_skills"]:
            m = r["missing_skills"][0]
            assert "skill" in m and "demand_count" in m
            return f"top missing: {m['skill']} (needed by {m['demand_count']} drives)"
        return "No missing skills (student covers all drive requirements!)"
    test("Missing skills have skill + demand_count fields", test_skill_gap_missing_fields,
         skip_if=(first_id is None), skip_reason="No students in DB")

    # ── 7. Pipeline — Full 12-Node Run ────────────────────────────────────────
    header("7 · SPIE Pipeline  (All 12 Nodes)")

    def test_pipeline_run():
        from pipeline.graph import run_pipeline
        r = run_pipeline(student_id=first_id)
        assert "final_score" in r, "Missing final_score"
        assert "verdict" in r, "Missing verdict"
        assert "aspect_results" in r, "Missing aspect_results"
        assert 0 <= r["final_score"] <= 100
        return (f"score={r['final_score']}/100, verdict='{r['verdict']}', "
                f"aspects={len(r['aspect_results'])}, "
                f"errors={r.get('errors',[])}")
    pipeline_ok = test("run_pipeline() completes successfully", test_pipeline_run,
                        skip_if=(first_id is None), skip_reason="No students in DB")

    def test_pipeline_aspects():
        from pipeline.graph import run_pipeline
        r = run_pipeline(student_id=first_id)
        names = {a["name"] for a in r["aspect_results"]}
        expected = {"Academic","Technical","MarketFit","Risk"}
        assert names == expected, f"Wrong aspects: {names}"
        for a in r["aspect_results"]:
            assert "penalized_score" in a
            assert "verdict" in a
            assert a["verdict"] in ("Strong","Average","Weak","Critical")
        return f"Aspects: {[(a['name'], a['verdict']) for a in r['aspect_results']]}"
    test("Pipeline produces 4 aspects with correct verdicts", test_pipeline_aspects,
         skip_if=(first_id is None or pipeline_ok is None),
         skip_reason="Pipeline failed or no student")

    def test_pipeline_cache():
        from pipeline.graph import run_pipeline
        import time
        t0 = time.time(); run_pipeline(student_id=first_id); t1 = time.time()
        t2 = time.time(); run_pipeline(student_id=first_id); t3 = time.time()
        first_ms  = (t1-t0)*1000
        second_ms = (t3-t2)*1000
        assert second_ms < first_ms, "Cached call should be faster"
        return f"First run: {first_ms:.0f}ms | Cached run: {second_ms:.0f}ms (faster ✓)"
    test("Pipeline cache: second call is faster", test_pipeline_cache,
         skip_if=(first_id is None or pipeline_ok is None),
         skip_reason="Pipeline failed or no student")

    def test_pipeline_explanation():
        from pipeline.graph import run_pipeline
        r = run_pipeline(student_id=first_id)
        exp = r.get("explanation", {})
        assert "headline" in exp, "Missing headline"
        assert "strengths" in exp
        assert "top_recommendation" in exp
        return f"headline: {exp['headline']}"
    test("Pipeline explanation has headline + recommendation", test_pipeline_explanation,
         skip_if=(first_id is None or pipeline_ok is None),
         skip_reason="Pipeline failed or no student")

    # ── 8. RAG ────────────────────────────────────────────────────────────────
    header("8 · RAG  (TF-IDF Retrieval + Template Answer)")

    def test_rag_build():
        from rag.retriever import build_index
        r = build_index()
        assert r["success"]
        assert r["doc_count"] > 0
        return f"Built index: {r['doc_count']} docs, types={r['doc_types']}"
    rag_ok = test("build_index() creates TF-IDF index", test_rag_build,
                   skip_if=(mongo_ok is None), skip_reason="MongoDB not connected")

    def test_rag_query():
        from rag.retriever import query_index
        docs = query_index("PHP developer low CGPA", top_k=3)
        assert isinstance(docs, list)
        assert len(docs) > 0
        assert "text" in docs[0]
        assert "similarity" in docs[0]
        return f"{len(docs)} docs retrieved | top similarity={docs[0]['similarity']}"
    test("query_index() retrieves relevant documents", test_rag_query,
         skip_if=(rag_ok is None), skip_reason="Index build failed")

    def test_rag_answer():
        from rag.retriever import query_index
        from rag.answerer  import generate_answer
        docs   = query_index("What companies hire Java developers?", top_k=3)
        answer = generate_answer("What companies hire Java developers?", docs)
        assert isinstance(answer, str) and len(answer) > 10
        return f"Answer: {answer[:100]}..."
    test("generate_answer() returns non-empty string", test_rag_answer,
         skip_if=(rag_ok is None), skip_reason="Index build failed")

    def test_rag_placement_rate():
        from rag.retriever import query_index
        from rag.answerer  import generate_answer
        docs   = query_index("placement rate percentage", top_k=3)
        answer = generate_answer("What is the placement rate?", docs)
        return f"Answer: {answer[:100]}"
    test("RAG answers placement rate query", test_rag_placement_rate,
         skip_if=(rag_ok is None), skip_reason="Index build failed")

    # ── 9. OCR ────────────────────────────────────────────────────────────────
    header("9 · OCR  (pytesseract + Pillow)")

    def check_ocr_import():
        from ocr.extractor import OCR_AVAILABLE
        return f"OCR_AVAILABLE={OCR_AVAILABLE}"
    test("ocr.extractor imports cleanly", check_ocr_import)

    def check_ocr_available():
        from ocr.extractor import OCR_AVAILABLE
        if not OCR_AVAILABLE:
            raise RuntimeError("pytesseract not installed. Run: pip install pytesseract Pillow")
        import pytesseract
        ver = pytesseract.get_tesseract_version()
        return f"Tesseract version: {ver}"
    test("Tesseract engine is installed and accessible", check_ocr_available)

    def test_ocr_preprocess():
        from ocr.extractor import OCR_AVAILABLE, preprocess_image
        if not OCR_AVAILABLE:
            raise RuntimeError("OCR not available")
        from PIL import Image
        # Create a synthetic white image with black text background
        img = Image.new("RGB", (800, 200), color=(255,255,255))
        processed = preprocess_image(img)
        assert processed.mode == "L", "Should be grayscale"
        assert processed.size[0] >= 800
        return f"Input: 800×200 RGB → Output: {processed.size[0]}×{processed.size[1]} grayscale"
    test("Image preprocessing pipeline (grayscale → sharpen → contrast)", test_ocr_preprocess)

    def test_ocr_parser():
        from ocr.extractor import parse_marksheet
        # Simulate OCR text from a typical mark sheet
        fake_text = """
        Goa College of Engineering
        Student Name: Arjun Das
        Roll No: CSE2024001
        Branch: Computer Engineering
        Semester: 6
        CGPA: 8.85
        SGPA: 9.12
        Data Structures   78 / 100
        Operating Systems 82 / 100
        """
        r = parse_marksheet(fake_text)
        assert r["cgpa"] == 8.85,        f"CGPA wrong: {r['cgpa']}"
        assert r["sgpa"] == 9.12,        f"SGPA wrong: {r['sgpa']}"
        assert r["student_name"] is not None, "Name not extracted"
        assert r["semester"] == 6,       f"Semester wrong: {r['semester']}"
        assert r["year"] == "3rd Year",  f"Year wrong: {r['year']}"
        return (f"CGPA={r['cgpa']}, SGPA={r['sgpa']}, "
                f"name='{r['student_name']}', sem={r['semester']}, "
                f"subjects={len(r['subject_marks'])}")
    test("parse_marksheet() correctly extracts CGPA/SGPA/name/semester", test_ocr_parser)

    def test_ocr_backlog_detection():
        from ocr.extractor import parse_marksheet
        text_with_fail = "Mathematics   FAIL\nDSA   KT\nOOP   85 / 100"
        r = parse_marksheet(text_with_fail)
        assert r["backlogs"] >= 2, f"Should detect 2 backlogs, got {r['backlogs']}"
        return f"Detected {r['backlogs']} backlog(s) from FAIL/KT markers"
    test("parse_marksheet() detects FAIL/KT as backlogs", test_ocr_backlog_detection)

    def test_ocr_bytes():
        from ocr.extractor import OCR_AVAILABLE, extract_from_bytes
        if not OCR_AVAILABLE:
            raise RuntimeError("OCR not available")
        import io
        from PIL import Image, ImageDraw
        # Create a real image with text drawn on it
        img  = Image.new("RGB", (600, 100), color=(255,255,255))
        draw = ImageDraw.Draw(img)
        draw.text((10,10), "CGPA: 8.50  Roll No: CSE001", fill=(0,0,0))
        buf  = io.BytesIO()
        img.save(buf, format="PNG")
        result = extract_from_bytes(buf.getvalue(), "test.png")
        assert result["success"], f"OCR failed: {result.get('error')}"
        assert "extracted" in result
        return f"OCR on synthetic image → CGPA={result['extracted'].get('cgpa')}"
    test("extract_from_bytes() processes PNG image end-to-end", test_ocr_bytes)


# ══════════════════════════════════════════════════════════════════════════════
# MODE 2 — HTTP TESTS (server must be running)
# ══════════════════════════════════════════════════════════════════════════════
def run_http_tests():
    print(f"\n{BOLD}{'='*60}")
    print(f"  MODE 2: HTTP TESTS  (FastAPI on port 8000)")
    print(f"{'='*60}{RESET}")

    try:
        import requests
    except ImportError:
        print(f"  {SKIP}  All HTTP tests — install requests: pip install requests")
        return

    BASE = "http://localhost:8000"

    # Check server is up
    def check_server():
        import requests
        r = requests.get(f"{BASE}/health", timeout=3)
        assert r.status_code == 200
        return r.json()
    server_ok = test("GET /health — server is running", check_server)
    if not server_ok:
        print(f"\n  {RED}Server not running. Start it first:{RESET}")
        print(f"  {CYAN}cd ml_service && python main.py{RESET}")
        return

    # Get first student_id from MongoDB for tests
    first_id = None
    try:
        from data.mongo_loader import load_students
        df = load_students()
        if not df.empty:
            first_id = df.iloc[0]["_id"]
    except Exception:
        pass

    header("HTTP · Pipeline Endpoints")

    def http_pipeline_run():
        import requests
        r = requests.post(f"{BASE}/pipeline/run",
                          json={"student_id": first_id}, timeout=30)
        assert r.status_code == 200, f"Status: {r.status_code} — {r.text[:100]}"
        data = r.json()
        assert "final_score" in data
        return f"score={data['final_score']}/100, verdict='{data['verdict']}'"
    test("POST /pipeline/run", http_pipeline_run,
         skip_if=(first_id is None), skip_reason="No student ID")

    def http_pipeline_result():
        import requests
        r = requests.get(f"{BASE}/pipeline/result/{first_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("cache_hit") == True
        return "Cache hit confirmed ✓"
    test("GET /pipeline/result/{id} — cached result", http_pipeline_result,
         skip_if=(first_id is None), skip_reason="No student ID")

    header("HTTP · ML Model Endpoints")

    def http_predict():
        import requests
        payload = {"cgpa": 8.0, "dsa_marks": 80, "oops_marks": 75,
                   "active_backlogs": 0, "skills": ["Java","React","DSA"]}
        r = requests.post(f"{BASE}/ml/predict", json=payload, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "confidence" in data and "placed" in data
        return f"placed={data['placed']}, confidence={data['confidence']}%"
    test("POST /ml/predict", http_predict)

    def http_recommend():
        import requests
        r = requests.get(f"{BASE}/ml/recommend/{first_id}?top_n=5", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "recommendations" in data
        return f"{data['count']} recommendations"
    test("GET /ml/recommend/{student_id}", http_recommend,
         skip_if=(first_id is None), skip_reason="No student ID")

    def http_risk():
        import requests
        r = requests.get(f"{BASE}/ml/risk/{first_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "risk_level" in data
        return f"risk={data['risk_level']}, suggestions={len(data['suggestions'])}"
    test("GET /ml/risk/{student_id}", http_risk,
         skip_if=(first_id is None), skip_reason="No student ID")

    def http_skill_gap():
        import requests
        r = requests.get(f"{BASE}/ml/skill-gap/{first_id}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "missing_skills" in data
        return f"missing={len(data['missing_skills'])} skills, coverage={data['coverage_pct']}%"
    test("GET /ml/skill-gap/{student_id}", http_skill_gap,
         skip_if=(first_id is None), skip_reason="No student ID")

    header("HTTP · RAG Endpoints")

    def http_rag_query():
        import requests
        r = requests.post(f"{BASE}/rag/query",
                          json={"query": "PHP developer low CGPA", "top_k": 3},
                          timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "answer" in data and len(data["answer"]) > 5
        return f"answer: {data['answer'][:80]}..."
    test("POST /rag/query", http_rag_query)

    def http_rag_index():
        import requests
        r = requests.post(f"{BASE}/rag/index", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success")
        return f"Indexed {data['doc_count']} documents"
    test("POST /rag/index — rebuild index", http_rag_index)

    header("HTTP · OCR Endpoint")

    def http_ocr_status():
        import requests
        r = requests.get(f"{BASE}/ocr/status", timeout=5)
        assert r.status_code == 200
        data = r.json()
        return f"OCR available={data['available']}"
    test("GET /ocr/status", http_ocr_status)

    def http_ocr_extract():
        import requests, io
        from PIL import Image, ImageDraw
        # Create synthetic mark sheet image
        img  = Image.new("RGB", (800, 300), color=(255,255,255))
        draw = ImageDraw.Draw(img)
        draw.text((20, 20),  "Goa College of Engineering",     fill=(0,0,0))
        draw.text((20, 60),  "Student Name: Test Student",      fill=(0,0,0))
        draw.text((20, 100), "Roll No: CSE2024099",             fill=(0,0,0))
        draw.text((20, 140), "CGPA: 7.85",                      fill=(0,0,0))
        draw.text((20, 180), "Semester: 6",                     fill=(0,0,0))
        draw.text((20, 220), "Branch: Computer Engineering",    fill=(0,0,0))
        buf  = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        r = requests.post(f"{BASE}/ocr/extract",
                          files={"file": ("test_marksheet.png", buf, "image/png")},
                          timeout=30)
        assert r.status_code == 200, f"Status {r.status_code}: {r.text[:100]}"
        data = r.json()
        assert data["success"]
        ext  = data["extracted"]
        return (f"CGPA={ext.get('cgpa')}, "
                f"name='{ext.get('student_name')}', "
                f"sem={ext.get('semester')}")
    test("POST /ocr/extract — synthetic mark sheet image", http_ocr_extract)

    header("HTTP · Error Handling")

    def http_bad_student():
        import requests
        r = requests.get(f"{BASE}/ml/risk/nonexistent_id_12345", timeout=5)
        assert r.status_code == 404
        return "404 returned for unknown student ✓"
    test("GET /ml/risk/{bad_id} returns 404", http_bad_student)

    def http_bad_predict():
        import requests
        r = requests.post(f"{BASE}/ml/predict", json={"cgpa": "not_a_number"}, timeout=5)
        assert r.status_code in (400, 422)
        return f"Status {r.status_code} for invalid input ✓"
    test("POST /ml/predict with invalid input returns 4xx", http_bad_predict)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--direct", action="store_true", help="Run only direct tests")
    parser.add_argument("--http",   action="store_true", help="Run only HTTP tests")
    args = parser.parse_args()

    print(f"\n{BOLD}{CYAN}{'='*60}")
    print(f"   EduPath SPIE -- ML Complete Test Suite")
    print(f"{'='*60}{RESET}")
    print(f"  {INFO}  Working directory: {ML_DIR}")

    run_direct = not args.http
    run_http   = not args.direct

    if run_direct:
        run_direct_tests()
    if run_http:
        run_http_tests()

    # ── Summary ────────────────────────────────────────────────────────────────
    total = results["passed"] + results["failed"] + results["skipped"]
    print(f"\n{BOLD}{'='*60}")
    print(f"   TEST SUMMARY")
    print(f"{'='*60}{RESET}")
    print(f"  {GREEN}PASSED : {results['passed']}{RESET}")
    print(f"  {RED}FAILED : {results['failed']}{RESET}")
    print(f"  {YELLOW}SKIPPED: {results['skipped']}{RESET}")
    print(f"  TOTAL  : {total}")

    if results["failed"] == 0:
        print(f"\n  {GREEN}{BOLD}🎉 ALL TESTS PASSED — ML pipeline is fully working!{RESET}")
    else:
        print(f"\n  {RED}{BOLD}❌ {results['failed']} test(s) failed — see errors above{RESET}")
        print(f"\n  Common fixes:")
        print(f"    • MongoDB not connected → check MONGO_URI in ml_service/.env")
        print(f"    • No students in DB     → run: node seed/seed.js from backend/")
        print(f"    • Tesseract not found   → install from: https://github.com/UB-Mannheim/tesseract/wiki")
        print(f"    • Server not running    → cd ml_service && python main.py")

    sys.exit(0 if results["failed"] == 0 else 1)
