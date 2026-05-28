"""
ocr/extractor.py
=================
Local OCR Engine using pytesseract + Pillow + pdf2image.
Zero external API — runs entirely on CPU.

WHAT IT DOES:
  1. Accepts a mark sheet image (.jpg/.png/.webp) or PDF
  2. Pre-processes the image (grayscale, contrast boost, denoise)
     to improve Tesseract accuracy on scanned documents
  3. Runs pytesseract to extract raw text
  4. Parses the extracted text to find:
       - CGPA / SGPA (pattern: "8.45" near "CGPA"/"GPA"/"Grade")
       - Student Name
       - Roll Number
       - Branch / Department
       - Semester marks (individual subject scores)
       - Active backlogs / KT / Failed subjects
  5. Returns a structured dict — ready to auto-fill the student profile

HOW pytesseract WORKS:
  pytesseract is a Python wrapper around Google's open-source Tesseract
  OCR engine (originally developed by HP, now maintained by Google).
  Tesseract reads the image pixel-by-pixel and uses LSTM neural networks
  (built into the engine, no separate download needed) to recognize characters.

  Accuracy depends heavily on image quality:
    - Clean, high-contrast → 95%+ accuracy
    - Skewed, low-DPI, noisy → 60–80% accuracy
  That's why we pre-process with Pillow before feeding to Tesseract.

PIPELINE INTEGRATION (Node 2 — Profile Loader):
  When a student uploads a mark sheet, the backend sends it here.
  Extracted fields are returned to Node 2, which merges them into
  raw_profile so downstream nodes use real extracted data.

SETUP REQUIREMENT:
  Tesseract engine must be installed on the OS (separate from pytesseract pip package):
    Windows: https://github.com/UB-Mannheim/tesseract/wiki
    Ubuntu:  sudo apt install tesseract-ocr
    macOS:   brew install tesseract
"""

import re
import io
import os
import tempfile
from pathlib import Path
from typing import Optional

try:
    import pytesseract
    from PIL import Image, ImageFilter, ImageEnhance, ImageOps
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("[OCR] Warning: pytesseract or Pillow not installed. OCR disabled.")

try:
    from pdf2image import convert_from_bytes
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("[OCR] Warning: pdf2image not installed. PDF OCR disabled.")


# ── Tesseract path (Windows only — update if Tesseract installed elsewhere) ──
TESSERACT_CMD = os.getenv(
    "TESSERACT_CMD",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # default Windows install path
)
if OCR_AVAILABLE and os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 1: Image Pre-processing
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def preprocess_image(img: "Image.Image") -> "Image.Image":
    """
    Applies a series of image enhancements to maximize Tesseract accuracy
    on scanned mark sheets (which are often low-contrast, slightly skewed).

    Pipeline:
      1. Convert to grayscale         — removes color noise
      2. Auto-level / invert if needed — handles dark backgrounds
      3. Sharpen                       — makes character edges crisper
      4. Contrast boost (×2.0)        — increases ink-paper separation
      5. Scale to ≥300 DPI            — Tesseract optimal resolution
         (if image is < 1000px wide, scale up 2×)

    Why each step matters for mark sheets:
      - Grayscale: Tesseract works better without color distractions
      - Sharpen: Printed text often scans blurry
      - Contrast: Faded ink or poor scan → bad OCR
      - Scale: Tesseract LSTM performs best at 300+ DPI
    """
    # 1. Grayscale
    img = img.convert("L")

    # 2. Auto-invert if mostly dark (white text on dark background)
    avg_brightness = sum(img.getdata()) / len(img.getdata())
    if avg_brightness < 128:
        img = ImageOps.invert(img)

    # 3. Sharpen
    img = img.filter(ImageFilter.SHARPEN)

    # 4. Contrast boost
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)

    # 5. Scale up if image is too small
    w, h = img.size
    if w < 1000:
        scale = max(2, 1000 // w)
        img = img.resize((w * scale, h * scale), Image.LANCZOS)

    return img


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 2: OCR Text Extraction
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_text_from_image(img: "Image.Image") -> str:
    """
    Runs pytesseract on a preprocessed PIL image and returns raw text.

    Config flags:
      --oem 3  → LSTM + Legacy engine (most accurate for printed text)
      --psm 6  → Assume uniform block of text (best for mark sheets)
    """
    if not OCR_AVAILABLE:
        return ""
    img   = preprocess_image(img)
    config = "--oem 3 --psm 6"
    text  = pytesseract.image_to_string(img, config=config, lang="eng")
    return text


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Converts each PDF page to an image, then runs OCR on each page.
    Returns all pages' text concatenated.

    Uses pdf2image (poppler backend) for PDF → PIL conversion.
    dpi=300 ensures high enough resolution for Tesseract.
    """
    if not PDF_AVAILABLE or not OCR_AVAILABLE:
        return ""
    images = convert_from_bytes(file_bytes, dpi=300)
    all_text = []
    for img in images:
        all_text.append(extract_text_from_image(img))
    return "\n".join(all_text)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Step 3: Information Parser
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def parse_marksheet(raw_text: str) -> dict:
    """
    Parses OCR-extracted text using regex patterns tailored for
    Indian engineering college mark sheets (Mumbai University, GTU, VTU, etc.)

    Patterns handle common formatting variations:
      "CGPA : 8.45", "CGPA: 8.45", "CGPA = 8.45", "CPI 8.45"

    Returns a structured dict with extracted fields.
    Undetected fields are None so the caller knows what's missing.
    """
    text = raw_text.replace("\n", " ").strip()

    extracted = {
        "cgpa":            None,
        "sgpa":            None,  # current semester GPA
        "student_name":    None,
        "roll_number":     None,
        "branch":          None,
        "semester":        None,
        "backlogs":        0,     # detected failed subjects
        "subject_marks":   [],    # list of (subject_name, marks_obtained, max_marks)
        "raw_text_length": len(raw_text),
        "ocr_confidence":  "high" if len(raw_text) > 200 else "low",
    }

    # ── CGPA ──────────────────────────────────────────────────────────────────
    cgpa_patterns = [
        r"(?:CGPA|CPI|Cumulative\s+GPA|Grade\s+Point\s+Average)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})",
        r"(?:CGPA|CPI)\s+(\d{1,2}[.,]\d{1,2})",
        r"(?:Overall|Total)\s+(?:CGPA|GPA)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})",
    ]
    for pat in cgpa_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                extracted["cgpa"] = float(m.group(1).replace(",", "."))
                # Validate: CGPA must be 0–10 (Indian scale)
                if not (0 <= extracted["cgpa"] <= 10):
                    extracted["cgpa"] = None
                else:
                    break
            except ValueError:
                pass

    # ── SGPA (current semester) ────────────────────────────────────────────────
    sgpa_patterns = [
        r"(?:SGPA|Semester\s+GPA|SPI)\s*[:\-=]?\s*(\d{1,2}[.,]\d{1,2})",
    ]
    for pat in sgpa_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                val = float(m.group(1).replace(",", "."))
                if 0 <= val <= 10:
                    extracted["sgpa"] = val
                    break
            except ValueError:
                pass

    # ── Student Name ───────────────────────────────────────────────────────────
    name_patterns = [
        r"(?:Student\s+Name|Name\s+of\s+Student|Name)\s*[:\-]?\s*([A-Z][a-zA-Z\s]{3,40})",
        r"(?:Mr\.|Ms\.|Mrs\.)\s+([A-Z][a-zA-Z\s]{3,40})",
    ]
    for pat in name_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            # Reject if name is actually a label
            if len(name) > 3 and not re.search(r'\d', name):
                extracted["student_name"] = name
                break

    # ── Roll Number ────────────────────────────────────────────────────────────
    roll_patterns = [
        r"(?:Roll\s+No|Enrollment\s+No|Seat\s+No|Reg(?:istration)?\s+No)\s*[:\-.]?\s*([A-Z0-9\-/]{5,20})",
        r"\b(\d{2}[A-Z]{1,3}\d{3,6})\b",   # e.g. 24BCO027, 21CE001
    ]
    for pat in roll_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            extracted["roll_number"] = m.group(1).strip()
            break

    # ── Branch / Department ────────────────────────────────────────────────────
    branch_map = {
        "computer engineering":      "CSE",
        "computer science":          "CSE",
        "information technology":    "IT",
        "it":                        "IT",
        "electronics":               "ECE",
        "electrical":                "EEE",
        "mechanical":                "ME",
        "civil":                     "CE",
        "cse":                       "CSE",
        "ece":                       "ECE",
        "eee":                       "EEE",
    }
    branch_pattern = r"(?:Branch|Department|Dept|Programme|Program)\s*[:\-.]?\s*([A-Za-z\s&]{3,40})"
    m = re.search(branch_pattern, text, re.IGNORECASE)
    if m:
        raw_branch = m.group(1).strip().lower()
        for key, val in branch_map.items():
            if key in raw_branch:
                extracted["branch"] = val
                break
        if not extracted["branch"]:
            extracted["branch"] = m.group(1).strip()[:10]  # Keep raw if no match

    # ── Semester ───────────────────────────────────────────────────────────────
    sem_patterns = [
        r"(?:Semester|Sem)\s*[:\-.]?\s*(\d{1,2}(?:st|nd|rd|th)?)",
        r"(\d{1,2})(?:st|nd|rd|th)\s+Semester",
    ]
    for pat in sem_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                sem_num = int(re.sub(r'\D', '', m.group(1)))
                if 1 <= sem_num <= 8:
                    extracted["semester"] = sem_num
                    # Map semester → year
                    if sem_num <= 2: extracted["year"] = "1st Year"
                    elif sem_num <= 4: extracted["year"] = "2nd Year"
                    elif sem_num <= 6: extracted["year"] = "3rd Year"
                    else: extracted["year"] = "4th Year"
                    break
            except ValueError:
                pass

    # ── Active Backlogs (Failed subjects = KT / Fail / F grade) ───────────────
    # Count lines with "FAIL", "KT", "FF", "AB" grade indicators
    fail_count = len(re.findall(
        r'\b(?:FAIL|KT|FF|AB|F\b|ATKT)',
        text, re.IGNORECASE
    ))
    extracted["backlogs"] = fail_count

    # ── Subject-level marks (optional — best-effort) ───────────────────────────
    # Pattern: Subject name ... digits / digits  (e.g. "Data Structures  78 / 100")
    subject_pattern = r"([A-Za-z\s&]{5,50}?)\s+(\d{2,3})\s*/\s*(\d{2,3})"
    matches = re.findall(subject_pattern, text)
    for subj, obtained, maximum in matches[:10]:   # cap at 10 subjects
        subj_clean = subj.strip()
        if len(subj_clean) > 5:
            extracted["subject_marks"].append({
                "subject":   subj_clean,
                "obtained":  int(obtained),
                "maximum":   int(maximum),
                "pct":       round(int(obtained) / max(int(maximum), 1) * 100, 1),
            })

    return extracted


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main Public API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def extract_from_bytes(file_bytes: bytes, filename: str) -> dict:
    """
    Main entry point: accepts raw file bytes + filename.
    Detects PDF vs image, runs appropriate OCR pipeline, returns parsed dict.

    Called from:
      - FastAPI endpoint POST /ocr/extract (file upload)
      - Node 2 (profile_loader) when mark sheet is being processed

    Returns:
      {
        success: bool,
        filename: str,
        raw_text: str,         (first 500 chars for debugging)
        extracted: {
          cgpa, sgpa, student_name, roll_number,
          branch, semester, year, backlogs, subject_marks,
          ocr_confidence
        },
        error: str | None
      }
    """
    if not OCR_AVAILABLE:
        return {
            "success": False,
            "error":   "OCR not available. Install: pip install pytesseract Pillow",
            "extracted": {}
        }

    ext = Path(filename).suffix.lower()

    try:
        if ext == ".pdf":
            if not PDF_AVAILABLE:
                return {"success": False, "error": "pdf2image not installed", "extracted": {}}
            raw_text = extract_text_from_pdf(file_bytes)
        elif ext in (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"):
            img      = Image.open(io.BytesIO(file_bytes))
            raw_text = extract_text_from_image(img)
        else:
            return {"success": False, "error": f"Unsupported file type: {ext}", "extracted": {}}

        if not raw_text.strip():
            return {
                "success":   False,
                "error":     "OCR extracted no text — image may be too dark or low resolution",
                "raw_text":  "",
                "extracted": {}
            }

        parsed = parse_marksheet(raw_text)

        return {
            "success":  True,
            "filename": filename,
            "raw_text": raw_text[:500] + ("..." if len(raw_text) > 500 else ""),
            "extracted": parsed,
            "error":    None,
        }

    except Exception as e:
        return {
            "success":  False,
            "filename": filename,
            "error":    str(e),
            "extracted": {}
        }
