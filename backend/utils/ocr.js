/**
 * backend/utils/ocr.js
 * =====================
 * OCR utility using tesseract.js (pure JS) + pdf-to-img (PDF support).
 * NO system-level Tesseract or Ghostscript install required.
 *
 * Supports: JPG, PNG, BMP, WEBP, TIFF, PDF
 */

const { createWorker } = require('tesseract.js');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

/**
 * Parse OCR raw text to extract structured fields from a mark sheet.
 */
function parseMarksheet(rawText) {
  const text = rawText.replace(/\n/g, ' ').trim();

  const result = {
    cgpa:           null,
    sgpa:           null,
    backlogs:       0,
    dsa_marks:      null,
    oops_marks:     null,
    roll_number:    null,
    student_name:   null,
    branch:         null,
    semester:       null,
    year:           null,
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

  // ── DSA / Data Structures / Algorithms marks ──────────────────────────
  const dsaPatterns = [
    /(?:data\s+structures?\s+(?:and\s+)?algorithms?|dsa|ds\s*(?:and|&)\s*a)\s*[\s:.|]*\s*(\d{1,3})\s*\//i,
    /(?:data\s+structures?|ds)\s*[\s:|]*(?:marks?)?\s*[:|]?\s*(\d{1,3})\s*(?:\/|out\s+of)\s*100/i,
    /(?:dsa|data\s+struct)\b[^\n]{0,40}?\b(\d{1,3})\b[^\n]{0,10}?\/\s*100/i,
  ];
  for (const pat of dsaPatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 0 && val <= 100) { result.dsa_marks = val; break; }
    }
  }

  // ── OOPs / Object Oriented Programming marks ───────────────────────
  const oopsPatterns = [
    /(?:object\s+oriented\s+(?:programming)?|oops?|oop|java\s+programming)\s*[\s:|.]*\s*(\d{1,3})\s*\//i,
    /(?:oops?|oop)\b[^\n]{0,40}?\b(\d{1,3})\b[^\n]{0,10}?\/\s*100/i,
    /(?:object\s+oriented)\b[^\n]{0,30}?(\d{1,3})\s*\/\s*100/i,
  ];
  for (const pat of oopsPatterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseInt(m[1]);
      if (val >= 0 && val <= 100) { result.oops_marks = val; break; }
    }
  }

  // ── Backlogs / KT / Fail ───────────────────────────────────────────
  // Try explicit backlog count first
  const backlogCountMatch = text.match(/(?:backlog|kt|atkt)s?\s*[:\-=]?\s*(\d+)/i);
  if (backlogCountMatch) {
    result.backlogs = parseInt(backlogCountMatch[1]) || 0;
  } else {
    // Fallback: count FAIL/KT/FF/AB occurrences
    const failCount = (text.match(/\b(?:FAIL|KT|FF|AB|ATKT)\b/gi) || []).length;
    result.backlogs = failCount;
  }

  return result;
}

/**
 * Run OCR on a single image file using tesseract.js.
 * @param {string} imagePath - absolute path to image file
 * @returns {Promise<string>} - raw text
 */
async function runTesseract(imagePath) {
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    const { data } = await worker.recognize(imagePath);
    return data.text || '';
  } finally {
    try { await worker.terminate(); } catch {}
  }
}

/**
 * Convert a PDF to images and OCR all pages.
 * Uses pdf-to-img (pdfjs-dist under the hood — pure JS, no Ghostscript).
 * @param {string} pdfPath - path to PDF on disk
 * @returns {Promise<string>} - all pages' text concatenated
 */
async function ocrPdf(pdfPath) {
  const { pdf } = await import('pdf-to-img');
  const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-pdf-'));
  const allText = [];

  try {
    const doc = await pdf(pdfPath, { scale: 3 }); // scale 3 = ~216 DPI
    let pageNum = 0;
    for await (const page of doc) {
      pageNum++;
      const imgPath = path.join(tmpDir, `page-${pageNum}.png`);
      fs.writeFileSync(imgPath, page);
      const text = await runTesseract(imgPath);
      allText.push(text);
      if (pageNum >= 3) break; // OCR max 3 pages for speed
    }
  } finally {
    // Clean up temp images
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  }

  return allText.join('\n');
}

/**
 * Main entry point — detect file type, run OCR, parse results.
 * @param {string} filePath     - absolute path to file on disk
 * @param {string} originalname - original filename (for extension detection)
 * @returns {Promise<object>}   - { success, extracted, raw_text, error }
 */
async function extractFromFile(filePath, originalname) {
  const ext = path.extname(originalname || filePath).toLowerCase();

  try {
    let rawText = '';

    if (ext === '.pdf') {
      // PDF → convert pages to images → OCR
      rawText = await ocrPdf(filePath);
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'].includes(ext)) {
      // Direct image OCR
      rawText = await runTesseract(filePath);
    } else {
      return {
        success: false,
        error:   `Unsupported file type: ${ext}. Please upload JPG, PNG, or PDF.`,
        extracted: { cgpa: null, backlogs: 0 },
      };
    }

    if (!rawText.trim()) {
      return {
        success: false,
        error:   'OCR extracted no text — image may be too dark or low resolution.',
        extracted: { cgpa: null, backlogs: 0 },
      };
    }

    const extracted = parseMarksheet(rawText);
    return {
      success:  true,
      raw_text: rawText.substring(0, 500),
      extracted,
      error:    null,
    };

  } catch (err) {
    return {
      success: false,
      error:   err.message,
      extracted: { cgpa: null, backlogs: 0 },
    };
  }
}

module.exports = { extractFromFile, parseMarksheet };
