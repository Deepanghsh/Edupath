/**
 * backend/routes/ml.js
 * =====================
 * Proxy routes for the SPIE ML microservice (port 8000).
 * All routes are JWT-protected — students/admins only.
 *
 * Frontend calls: api.get('/ml/insights')
 * This proxy calls: http://localhost:8000/pipeline/run
 * And returns the result back to the frontend.
 *
 * Why a proxy instead of frontend calling ML directly?
 *   1. JWT validation happens here (no exposed ML service)
 *   2. student_id is extracted from the verified token (no spoofing)
 *   3. ML service stays internal — never exposed to browser
 */

const router  = require('express').Router();
const axios   = require('axios');
const verify  = require('../middleware/verifyToken');
const role    = require('../middleware/checkRole');
const multer  = require('multer');

const ML_URL  = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = 45000; // 45s — ML on Render free tier cold-starts slowly

// Multer for OCR file uploads (memory storage — pass bytes to ML)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Helper: axios with retry on 429 / 503 ────────────────────────────────────
const axiosWithRetry = async (fn, maxRetries = 2) => {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      // Only retry on rate-limit or service-unavailable
      if ((status === 429 || status === 503) && attempt < maxRetries) {
        const delay = (attempt + 1) * 3000; // 3s, 6s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
};

// ── Helper: forward error from ML service ─────────────────────────────────────
const mlError = (res, err) => {
  const status = err.response?.status || 503;
  const msg    = err.response?.data?.detail || err.message || 'ML service unavailable';
  console.error('[ML Proxy]', err.message);
  if (status === 429) {
    return res.status(429).json({
      error: 'ML service is temporarily rate-limited. Please wait a moment and try again.',
      retry_after: 30,
    });
  }
  return res.status(status).json({ error: msg });
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDENT ROUTES  (JWT required, student role)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/ml/insights
 * Runs the full 12-node SPIE pipeline for the logged-in student.
 * Returns: { final_score, verdict, aspect_results, explanation,
 *            recommendations, risk_assessment, skill_gap, cache_hit }
 */
router.get('/insights', verify, role('student'), async (req, res) => {
  try {
    const student_id = req.user.id;
    const { data } = await axiosWithRetry(() =>
      axios.post(`${ML_URL}/pipeline/run`, { student_id }, { timeout: TIMEOUT })
    );
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * DELETE /api/ml/insights/refresh
 * Clears the cache so next /insights call does a full fresh run.
 */
router.delete('/insights/refresh', verify, role('student'), async (req, res) => {
  try {
    const { data } = await axios.delete(
      `${ML_URL}/pipeline/invalidate/${req.user.id}`, { timeout: 5000 });
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * GET /api/ml/recommend
 * TF-IDF drive recommendations ranked by skill match for logged-in student.
 */
router.get('/recommend', verify, role('student'), async (req, res) => {
  try {
    const top_n = req.query.top_n || 5;
    const { data } = await axiosWithRetry(() =>
      axios.get(`${ML_URL}/ml/recommend/${req.user.id}?top_n=${top_n}`, { timeout: 15000 })
    );
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * GET /api/ml/risk
 * K-Means risk cluster + suggestions for logged-in student.
 */
router.get('/risk', verify, role('student'), async (req, res) => {
  try {
    const { data } = await axiosWithRetry(() =>
      axios.get(`${ML_URL}/ml/risk/${req.user.id}`, { timeout: 15000 })
    );
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * GET /api/ml/skill-gap
 * Missing skills ranked by demand count for logged-in student.
 */
router.get('/skill-gap', verify, role('student'), async (req, res) => {
  try {
    const { data } = await axiosWithRetry(() =>
      axios.get(`${ML_URL}/ml/skill-gap/${req.user.id}`, { timeout: 15000 })
    );
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * POST /api/ml/rag
 * MongoDB-native RAG: answer a placement-related question.
 * Body: { query: "Which companies hire PHP developers?" }
 */
router.post('/rag', verify, async (req, res) => {
  try {
    const { query, top_k = 3 } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const { data } = await axiosWithRetry(() =>
      axios.post(`${ML_URL}/rag/query`, { query, student_id: req.user.id, top_k }, { timeout: 15000 })
    );
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * POST /api/ml/ocr
 * Upload a mark sheet image/PDF → extract CGPA, roll no., backlogs.
 * Uses multer (memoryStorage) to receive the file, writes to temp, streams to ML.
 */
router.post('/ocr', verify, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const FormData = require('form-data');
    const fs       = require('fs');
    const os       = require('os');
    const path     = require('path');
    
    // Write buffer to a temp file so form-data can stream it properly to FastAPI
    const tmpPath = path.join(os.tmpdir(), `ocr-${Date.now()}-${req.file.originalname || 'upload.jpg'}`);
    fs.writeFileSync(tmpPath, req.file.buffer);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(tmpPath), {
      filename:    req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype || 'image/jpeg',
    });
    
    const { data } = await axios.post(`${ML_URL}/ocr/extract`, form, {
      headers:  form.getHeaders(),
      timeout:  35000,
      maxContentLength: Infinity,
      maxBodyLength:    Infinity,
    });
    
    // Clean up temp file
    try { fs.unlinkSync(tmpPath); } catch {}
    
    res.json(data);
  } catch (err) { mlError(res, err); }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN ROUTES  (JWT required, admin role)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * GET /api/ml/admin/insights/:student_id
 * Run SPIE pipeline for any student (admin view).
 */
router.get('/admin/insights/:student_id', verify, role('admin'), async (req, res) => {
  try {
    const { data } = await axios.post(`${ML_URL}/pipeline/run`,
      { student_id: req.params.student_id }, { timeout: TIMEOUT });
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * GET /api/ml/admin/batch-risk
 * Returns risk level for ALL students — used in admin dashboard risk panel.
 * Calls /ml/risk/:id for each student (runs in parallel).
 */
router.get('/admin/batch-risk', verify, role('admin'), async (req, res) => {
  try {
    const Student = require('../models/Student');
    const students = await Student.find({}, '_id full_name cgpa tier').lean();

    // Run risk predictions in parallel (max 10 at once)
    const BATCH = 10;
    const results = [];
    for (let i = 0; i < students.length; i += BATCH) {
      const batch = students.slice(i, i + BATCH);
      const settled = await Promise.allSettled(
        batch.map(s => axios.get(`${ML_URL}/ml/risk/${s._id}`, { timeout: 8000 })
          .then(r => ({ ...s, ...r.data, _id: s._id.toString() }))
          .catch(() => ({ ...s, _id: s._id.toString(), risk_level: 'Unknown', suggestions: [] }))
        )
      );
      results.push(...settled.map(r => r.value || r.reason));
    }

    // Group by risk level
    const summary = {
      High:   results.filter(s => s.risk_level === 'High Risk').length,
      Medium: results.filter(s => s.risk_level === 'Medium Risk').length,
      Low:    results.filter(s => s.risk_level === 'Low Risk').length,
    };

    res.json({ students: results, summary });
  } catch (err) { mlError(res, err); }
});

/**
 * POST /api/ml/admin/train
 * Retrain all ML models (admin only). Runs in background.
 */
router.post('/admin/train', verify, role('admin'), async (req, res) => {
  try {
    const { data } = await axios.post(`${ML_URL}/ml/train`, {}, { timeout: 10000 });
    res.json(data);
  } catch (err) { mlError(res, err); }
});

/**
 * GET /api/ml/health
 * ML service health check (public — for admin status panel).
 */
router.get('/health', async (req, res) => {
  try {
    const { data } = await axios.get(`${ML_URL}/health`, { timeout: 4000 });
    res.json({ ...data, ml_service_url: ML_URL });
  } catch {
    res.status(503).json({ status: 'down', ml_service_url: ML_URL });
  }
});

module.exports = router;
