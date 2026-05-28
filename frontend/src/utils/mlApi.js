// frontend/src/utils/mlApi.js
// ============================
// All ML-related API calls — thin wrappers around the /api/ml/* proxy.
// Import api from './api' (already has JWT interceptor attached).

import api from './api';

// ── Student ML calls ──────────────────────────────────────────────────────────

/** Full SPIE pipeline: returns score, verdict, 4 aspects, explanation */
export const getMLInsights = () => api.get('/ml/insights');

/** Force-refresh: clears cache so next getMLInsights does a full run */
export const refreshMLInsights = () => api.delete('/ml/insights/refresh');

/** TF-IDF ranked drive recommendations */
export const getRecommendations = (top_n = 5) =>
  api.get(`/ml/recommend?top_n=${top_n}`);

/** K-Means risk cluster + suggestions */
export const getRiskAssessment = () => api.get('/ml/risk');

/** Skill gap: missing skills ranked by demand */
export const getSkillGap = () => api.get('/ml/skill-gap');

/** RAG chat: ask a placement question */
export const askRAG = (query, top_k = 3) =>
  api.post('/ml/rag', { query, top_k });

/** Upload mark sheet image/PDF for OCR extraction */
export const extractMarksheet = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/ml/ocr', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 35000,
  });
};

// ── Admin ML calls ────────────────────────────────────────────────────────────

/** Run SPIE pipeline for a specific student (admin only) */
export const getStudentInsights = (student_id) =>
  api.get(`/ml/admin/insights/${student_id}`);

/** Get risk levels for all students — for admin risk panel */
export const getBatchRisk = () => api.get('/ml/admin/batch-risk');

/** Retrain all ML models on latest data */
export const trainModels = () => api.post('/ml/admin/train');

/** Check if ML service is running */
export const getMLHealth = () => api.get('/ml/health');
