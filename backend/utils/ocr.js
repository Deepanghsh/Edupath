/**
 * backend/utils/ocr.js
 * =====================
 * OCR utility using tesseract.js — pure JavaScript Tesseract port.
 * NO system-level Tesseract install required. Works on any OS.
 *
 * Usage:
 *   const { extractFromFile } = require('./ocr');
 *   const result = await extractFromFile(filePath, originalname);
 *   // result = { success, extracted: { cgpa, backlogs, roll_number, ... } }
 */

const { createWorker } = require('tesseract.js');
const path = require('path');

/**
 * Parse OCR raw text to extract structured fields from an Indian
 * engineering college mark sheet (Mumbai Uni, GTU, VTU, Goa Uni, etc.)
 */
function parseMarksheet(rawText) {
  const text = rawText.replace(/\n/g, ' ').trim();

  const result = {
    cgpa:          null,
    sgpa:          null,
    backlogs:      0,
    roll_number:   null,
    student_name:  null,
    branch:        null,
    semester:      null,
    year:          null,
    raw_text_length: rawText.length,
    ocr_confidence: rawText.length > 200 ? 'high' : 'low',
  };

  // ── CGPA ──────────────────────────────────────────────────────────────────
  const cgpaPatterns = [
    /(?:CGPA|CPI|Cumulative\s+GPA|Grade\s+Point\s+Average)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})/i,
    /(?:CGPA|CPI)\s+(\d{1,2}[.,]\d{1,2})/i,
    /(?:Overall|Total)\s+(?:CGPA|GPA)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})/i,
  ];
  for (const pat of cgpaPatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val >= 0 && val <= 10) { result.cgpa = val; break; }
    }
  }

  // ── SGPA ──────────────────────────────────────────────────────────────────
  const sgpaMatch = text.match(/(?:SGPA|Semester\s+GPA|SPI)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})/i);
  if (sgpaMatch) {
    const val = parseFloat(sgpaMatch[1].replace(',', '.'));
    if (val >= 0 && val <= 10) result.sgpa = val;
  }

  // ── Roll Number ────────────────────────────────────────────────────────────
  const rollPatterns = [
    /(?:Roll\s+No|Enrollment\s+No|Seat\s+No|Reg(?:istration)?\s+No)\s*[:\-.]?\s*([A-Z0-9\-/]{4,20})/i,
    /\b(\d{2}[A-Z]{1,3}\d{3,6})\b/,
  ];
  for (const pat of rollPatterns) {
    const m = text.match(pat);
    if (m) { result.roll_number = m[1].trim(); break; }
  }

  // ── Student Name ───────────────────────────────────────────────────────────
  const nameMatch = text.match(/(?:Student\s+Name|Name\s+of\s+Student|Name)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})/i);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (name.length > 3 && !/\d/.test(name)) result.student_name = name;
  }

  // ── Branch ────────────────────────────────────────────────────────────────
  const branchMap = {
    'computer engineering': 'CSE', 'computer science': 'CSE',
    'information technology': 'IT', 'electronics': 'ECE',
    'electrical': 'EEE', 'mechanical': 'ME', 'civil': 'CE',
  };
  const branchMatch = text.match(/(?:Branch|Department|Dept|Programme)\s*[:\-.]?\s*([A-Za-z\s&]{3,40})/i);
  if (branchMatch) {
    const raw = branchMatch[1].toLowerCase();
    for (const [key, val] of Object.entries(branchMap)) {
      if (raw.includes(key)) { result.branch = val; break; }
    }
  }

  // ── Semester ──────────────────────────────────────────────────────────────
  const semMatch = text.match(/(?:Semester|Sem)\s*[:\-.]?\s*(\d{1,2})/i);
  if (semMatch) {
    const sem = parseInt(semMatch[1]);
    if (sem >= 1 && sem <= 8) {
      result.semester = sem;
      if      (sem <= 2) result.year = '1st Year';
      else if (sem <= 4) result.year = '2nd Year';
      else if (sem <= 6) result.year = '3rd Year';
      else               result.year = '4th Year';
    }
  }

  // ── Backlogs / KT / Fail ──────────────────────────────────────────────────
  const failCount = (text.match(/\b(?:FAIL|KT|FF|AB|ATKT)\b/gi) || []).length;
  result.backlogs = failCount;

  return result;
}

/**
 * Run OCR on a file (image or PDF page) using tesseract.js.
 * @param {string} filePath   - Absolute path to the file on disk
 * @param {string} originalname - Original filename (used to detect type)
 * @returns {Promise<object>} - { success, extracted, raw_text, error }
 */
async function extractFromFile(filePath, originalname) {
  const ext = path.extname(originalname || filePath).toLowerCase();

  // tesseract.js supports jpg, png, bmp, pbm, webp natively
  // For PDF we skip OCR and return a clear message (pdf2image not available in Node)
  if (ext === '.pdf') {
    return {
      success: false,
      error: 'PDF OCR not supported in browser mode. Please upload a JPG or PNG image of your mark sheet.',
      extracted: { cgpa: null, backlogs: 0 },
    };
  }

  const supported = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'];
  if (!supported.includes(ext)) {
    return {
      success: false,
      error: `Unsupported file type: ${ext}. Use JPG or PNG.`,
      extracted: { cgpa: null, backlogs: 0 },
    };
  }

  let worker;
  try {
    worker = await createWorker('eng', 1, {
      logger: () => {},  // suppress progress logs
    });

    const { data } = await worker.recognize(filePath);
    const rawText = data.text || '';

    if (!rawText.trim()) {
      return {
        success: false,
        error: 'OCR extracted no text — image may be too dark or low resolution.',
        extracted: { cgpa: null, backlogs: 0 },
      };
    }

    const extracted = parseMarksheet(rawText);
    return {
      success:   true,
      raw_text:  rawText.substring(0, 500),
      extracted,
      error:     null,
    };
  } catch (err) {
    return {
      success: false,
      error:   err.message,
      extracted: { cgpa: null, backlogs: 0 },
    };
  } finally {
    if (worker) {
      try { await worker.terminate(); } catch {}
    }
  }
}

module.exports = { extractFromFile, parseMarksheet };
