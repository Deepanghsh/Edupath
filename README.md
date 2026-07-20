<p align="center">
  <img src="https://img.shields.io/badge/EduPath-SPIE-1e5fa8?style=for-the-badge&logo=mortarboard&logoColor=white" alt="EduPath" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn" />
  <img src="https://img.shields.io/badge/Cloudinary-Upload-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Tesseract-OCR-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Tesseract" />
</p>

# 🎓 EduPath — AI-Powered Student Placement Intelligence Engine

> A full-stack placement management system with a deterministic 12-node ML pipeline (SPIE) that predicts placement readiness, recommends drives, clusters risk, identifies skill gaps, and answers placement queries — all without any external API, LLM, or paid service.

### 🌐 Live Deployment

| Service | URL |
|---|---|
| **Frontend** | [edupath-peach.vercel.app](https://edupath-peach.vercel.app) |
| **Backend API** | [edupath-z2sy.onrender.com](https://edupath-z2sy.onrender.com) |
| **ML Service** | [edupath-ml.onrender.com](https://edupath-ml.onrender.com) |

### 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@college.edu` | `admin123` |
| **Student** | `arjun.das@college.edu` | `student123` |

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Team & Responsibilities](#-team--responsibilities)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [ML Pipeline — SPIE Architecture](#-ml-pipeline--spie-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [ML Models Deep Dive](#-ml-models-deep-dive)
- [OCR & Document Processing](#-ocr--document-processing)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Scoring Formula](#-scoring-formula)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**EduPath** is a Training & Placement Office (TPO) automation platform designed for engineering colleges. It replaces manual Excel-based workflows with a secure, role-based web application that connects students, placement officers (admins), and an AI intelligence engine.

### The Problem

- Students have no visibility into which placement drives they qualify for.
- TPOs manually track eligibility, applications, and results across spreadsheets.
- There is no predictive system to identify at-risk students before placement season.
- Skill gap analysis between student profiles and industry demand is non-existent.

### The Solution

EduPath provides:
1. **Self-service student portal** with real-time drive eligibility, application tracking, document uploads, and OCR-powered auto-extraction.
2. **Admin dashboard** for drive management, bulk eligibility engine, document verification, and analytics.
3. **SPIE (Student Placement Intelligence Engine)** — a deterministic ML pipeline that runs 4 models in parallel to produce an actionable placement readiness score.

---

## 👥 Team & Responsibilities

This project was developed collaboratively by our team:

| Member Name | Roll No | Primary Role & Responsibilities |
|---|---|---|
| **Daksh Deepak Naik** | 24B-CO-016 | **Frontend (Admin Portal)** — Developed the TPO Admin dashboard, student management, drive CRUD, eligibility engine UI, and analytics charts. |
| **Deepanghsh Dilkush Naik** | 24B-CO-017 | **Frontend (Student Portal)** — Developed the student dashboard, profile management, mark sheet upload, drive browser, and application tracking. |
| **Chirag Nikant Simepurushkar** | 24B-CO-015 | **Backend (Node.js + ML Integration)** — Engineered the Node.js REST API, authentication, eligibility engine logic, scorer utility, OCR pipeline, Cloudinary integration, and ML service proxy. |
| **Chirag Dilipkumar Vengurlekar** | 24B-CO-014 | **Database Architecture** — Designed the database schema, models, relationships, and data flow structures. |

---

## 🏗 In-Depth Component Structure

### 📁 Project Folder Structure

The project follows a strict separation of concerns for both frontend and backend:

**Frontend (`frontend/src/` folders)**
*   `pages/admin/` — Admin screens (Dashboard, Drives, Students, Applications, Verification, Readiness, Settings)
*   `pages/student/` — Student screens (Dashboard, Drive Browser, Applications, Settings, Notifications)
*   `components/admin/` — Admin-only components (AdminLayout, ui design system)
*   `components/ml/` — ML widget components (SPIEScoreCard, DriveRecommendations, SkillGapWidget, RAGChat)
*   `components/` — Shared components (Sidebar, ToastContainer, ToggleSwitch)
*   `context/` — AppContext (React context)
*   `data/` — Mock data + theme configuration
*   `utils/` — Axios instance (api.js), ML API helpers (mlApi.js), Toast hook (useToast.js)

**Backend (`backend/` folders)**
*   `routes/` — Express route files (auth, student, admin, ml)
*   `controllers/` — Business logic per route (7 controllers)
*   `models/` — Mongoose ODM models (5 models)
*   `middleware/` — JWT auth, RBAC guards, rate limiter, file upload config
*   `utils/` — Scorer, OCR engine (Tesseract.js), Resume parser, RAG answers
*   `config/` — MongoDB connection (db.js)
*   `seed/` — Database seeder

### 🧑‍💻 Frontend Details — Admin Portal (TPO Admin)
*Owned by Daksh Deepak Naik*

*   **Admin Dashboard** — KPI Cards (Total Students, Drives, Placements, Verifications), Tier Distribution Pie Chart, Upcoming Drives mini-cards.
*   **Student Management** — Full CRUD, filtering (CGPA, Backlogs, Tier), bulk shortlisting engine UI, verification approval workflow.
*   **Drive Management** — Create/Edit drives, skill tag inputs, application tracking.
*   **Document Verification** — Review uploaded mark sheets and resumes, approve/reject with one click. View PDFs via Google Docs Viewer and images directly.
*   **Application Management** — Update application statuses (Applied → Shortlisted → Selected/Rejected), add feedback per student.
*   **Readiness Overview** — Tier-wise readiness analysis across all students.
*   **ML Risk Panel** — Batch risk assessment across all students (High/Medium/Low).

### 🎓 Frontend Details — Student Portal
*Owned by Deepanghsh Dilkush Naik*

*   **Student Dashboard** — Employability Score Ring, active applications summary, eligible drives quick-view, SPIE ML widgets.
*   **Profile & Settings** — Edit CGPA, DSA/OOPs marks, skills checklist. Upload mark sheet (PDF/JPG/PNG) with auto-OCR extraction. Upload resume (PDF/DOCX/TXT/JPG/PNG) with auto skill detection.
*   **Drive Browser** — Grid view of active drives with real-time eligibility indicators (Green ✓ / Red ✗). 1-click apply.
*   **My Applications** — Application history with status timeline (Applied → Shortlisted → Selected/Rejected).
*   **Notifications** — Real-time toast notifications, mark-as-read, mark-all-read.

### ⚙️ Backend Logic & Core Engines
*Owned by Chirag Nikant Simepurushkar*

*   **Eligibility Engine (`shortlistController`):** Filters students dynamically against drive requirements (CGPA >= min, Backlogs <= max, Skills intersection).
*   **Readiness Score Calculator (`scorer`):** Calculates Employability Score: `(Academic × 0.4) + (Tech_Skill × 0.3) + (Aptitude × 0.3)`. Assigns Tiers (1, 2, 3).
*   **OCR Engine (`ocr.js`):** Tesseract.js-based OCR pipeline for mark sheets — extracts CGPA, backlogs, DSA/OOPs marks from uploaded images/PDFs. Uses `pdf-to-img` for PDF-to-image conversion, then runs Tesseract at 3× scale for optimal accuracy.
*   **Resume Parser (`resumeParser.js`):** Extracts text from PDF (via `pdf-parse`), DOCX, TXT, and images (via Tesseract.js OCR). Matches extracted text against a 12-skill keyword dictionary to auto-detect skills.
*   **Cloudinary Integration:** All file uploads (mark sheets + resumes) go directly to Cloudinary using memory buffers — no local disk writes. PDFs use `resource_type: 'raw'`, images use `resource_type: 'image'`.
*   **Document Viewer:** PDFs are displayed via Google Docs Viewer (`docs.google.com/viewer?url=...`), images are displayed directly via Cloudinary URLs.
*   **Predictive Early Warning:** Automatically increments rejection counts on application failure. Flags students with 3+ rejections for mentorship.
*   **Security Stack:** JWT verification, Role-Based Access Control (RBAC), bcrypt hashing, rate limiting, and multipart/form-data handling.
*   **RAG Answers (`ragAnswers.js`):** Template-based placement Q&A engine that queries MongoDB data directly — no external LLM needed.

### 🗄 Database Design
*Owned by Chirag Dilipkumar Vengurlekar*

*(See the Database Schema section below for detailed field structures, types, and constraints across Student, Admin, CompanyDrive, Application, and Notification tables).*

---

## ✨ Key Features

### 🧑‍🎓 Student Portal
| Feature | Description |
|---|---|
| **JWT + Google OAuth** | Secure login with email/password or Google Sign-In |
| **Profile & Settings** | Edit CGPA, backlogs, DSA/OOPs marks, skills, roll number |
| **Mark Sheet Upload** | Upload PDF/JPG/PNG → OCR auto-extracts CGPA, backlogs, DSA & OOPs marks |
| **Resume Upload** | Upload PDF/DOCX/TXT/JPG/PNG → auto-detects skills from resume content |
| **Document Viewer** | View uploaded mark sheets and resumes directly in browser |
| **Employability Score** | Auto-calculated on every profile save using weighted formula |
| **Drive Browser** | View all active drives with eligibility status per drive |
| **1-Click Apply** | Apply to eligible drives directly from the browser |
| **Application Tracker** | Track status: Applied → Shortlisted → Selected / Rejected |
| **Notifications** | Real-time notifications for drive updates and results |
| **SPIE Score Card** | AI-generated placement readiness score with 4 aspect breakdown |
| **Drive Recommendations** | TF-IDF ranked drives matched to your skill profile |
| **Skill Gap Analysis** | Missing skills ranked by how many drives demand them |
| **RAG Chat** | Ask placement questions — answered from MongoDB data, no LLM |

### 🔑 Admin Dashboard
| Feature | Description |
|---|---|
| **Dashboard KPIs** | Total students, drives, applications, placement rate at a glance |
| **Student Management** | View, filter, search students with detailed profiles |
| **Document Verification** | Review mark sheets & resumes, approve/reject with one click |
| **Drive CRUD** | Create, edit, delete placement drives with skill requirements |
| **Eligibility Engine** | 1-click bulk shortlisting based on CGPA, backlogs, and skills |
| **Application Management** | Update application statuses, add feedback per student |
| **Placement Analytics** | Branch-wise, company-wise, tier-wise placement breakdown |
| **ML Risk Panel** | Batch risk assessment across all students (High/Medium/Low) |
| **Model Retraining** | One-click retrain all 4 ML models on latest data |
| **Notification Broadcast** | Send drive notifications to all eligible students |

### 🤖 ML Intelligence Engine (SPIE)
| Feature | Description |
|---|---|
| **Placement Predictor** | Random Forest classifier — probability of getting placed |
| **Drive Recommender** | TF-IDF cosine similarity — ranks drives by skill match |
| **Risk Clusterer** | K-Means unsupervised — clusters students into risk levels |
| **Skill Gap Analyzer** | Set-difference counter — finds missing skills by demand |
| **12-Node Pipeline** | StateGraph with fan-out/fan-in parallel execution |
| **SHA-256 Cache** | MongoDB-backed result cache with daily TTL (11× speedup) |
| **OCR Engine** | Tesseract.js for mark sheet & resume image extraction |
| **RAG Retriever** | TF-IDF retrieval from MongoDB — no external API needed |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                        │
│                                                                 │
│   React 19 + Vite 8 + React Router 7 + Vanilla CSS             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│   │ AuthPage │ │ Student  │ │  Admin   │ │ ML       │         │
│   │ (Login/  │ │ Dashboard│ │ Dashboard│ │ Widgets  │         │
│   │ Register)│ │ + Drives │ │ + CRUD   │ │ (4 JSX)  │         │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│        │             │            │             │               │
│        └─────────────┴────────────┴─────────────┘               │
│                         │  Axios + JWT                          │
│              Hosted on: Vercel                                  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express 5)                │
│                     Hosted on: Render                           │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    Middleware Layer                       │  │
│   │  JWT Verify → Role Check → Rate Limiter → Morgan Logger │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │ /api/    │ │ /api/    │ │ /api/    │ │ /api/ml/*        │  │
│   │  auth/*  │ │ student/*│ │ admin/*  │ │ (Proxy → ML)     │  │
│   └──────────┘ └──────────┘ └──────────┘ └────────┬─────────┘  │
│                                                    │            │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              Mongoose ODM (5 Models)                     │  │
│   │  Student · Admin · CompanyDrive · Application · Notif    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              File Processing                             │  │
│   │  Tesseract.js OCR · pdf-parse · pdf-to-img · Cloudinary │  │
│   └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   MongoDB Atlas  │  │   Cloudinary    │  │ ML SERVICE (FastAPI) │
│                  │  │   Cloud CDN     │  │ Hosted on: Render    │
│ Collections:     │  │                 │  │                     │
│ • students       │  │ Folders:        │  │ 12-Node SPIE        │
│ • admins         │  │ • edupath_      │  │ Pipeline             │
│ • companydrives  │  │   marksheets    │  │                     │
│ • applications   │  │ • edupath_      │  │ PyMongo (direct)     │
│ • notifications  │  │   resumes      │  │ reads same DB       │
│ • pipeline_cache │  │                 │  │                     │
└──────────────────┘  └─────────────────┘  └─────────────────────┘
```

### Data Flow

```
Student Login → JWT Issued → Frontend stores token
     │
     ▼
Frontend calls GET /api/ml/insights (JWT in header)
     │
     ▼
Backend /api/ml/* proxy → validates JWT → extracts student_id
     │
     ▼
Axios POST to ML_SERVICE_URL/pipeline/run { student_id }
     │
     ▼
SPIE Pipeline (12 nodes) → returns JSON
     │
     ▼
Backend returns ML result to frontend
     │
     ▼
React widgets render: Score Ring, Recommendations, Skill Gap, RAG
```

### Document Upload Flow

```
Student uploads Mark Sheet (PDF/JPG/PNG)
     │
     ▼
Multer (memoryStorage) → Buffer in req.file.buffer
     │
     ├──→ Cloudinary Upload (resource_type: raw|image)
     │         → returns secure_url + public_id
     │
     └──→ OCR Pipeline (Tesseract.js)
              │
              ├── PDF: pdf-to-img → page images → Tesseract
              └── Image: direct Tesseract recognition
              │
              ▼
         parseMarksheet(rawText)
              │
              ├── Extract CGPA (regex)
              ├── Extract Backlogs count
              ├── Extract DSA marks (line-based parsing)
              └── Extract OOPs marks (line-based parsing)
              │
              ▼
         Auto-fill profile fields + save to DB
```

---

## 🤖 ML Pipeline — SPIE Architecture

The **Student Placement Intelligence Engine (SPIE)** is a deterministic, 12-node StateGraph pipeline that processes student data through 4 phases:

```
                           ┌──────────────┐
                           │   INPUT      │
                           │  student_id  │
                           └──────┬───────┘
                                  │
                    ══════════════════════════════
                    ║   PHASE 1: INGESTION      ║
                    ══════════════════════════════
                                  │
                           ┌──────┴───────┐
                           │ Node 1:      │
                           │ Cache Check  │──── HIT ──→ Skip to Phase 4
                           │ (SHA-256)    │
                           └──────┬───────┘
                                  │ MISS
                           ┌──────┴───────┐
                           │ Node 2:      │
                           │ Data Loader  │
                           │ (PyMongo)    │
                           └──────┬───────┘
                                  │
                    ══════════════════════════════
                    ║   PHASE 2: DECOMPOSE      ║
                    ══════════════════════════════
                                  │
                           ┌──────┴───────┐
                           │ Node 3:      │
                           │ Feature      │
                           │ Extraction   │
                           └──────┬───────┘
                                  │
                    ══════════════════════════════
                    ║   PHASE 3: PARALLEL FAN-OUT║
                    ══════════════════════════════
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
        ┌─────┴─────┐     ┌──────┴──────┐     ┌──────┴──────┐
        │ Node 4:   │     │ Node 6:     │     │ Node 8:     │
        │ Academic  │     │ Technical   │     │ Market Fit  │
        │ Analysis  │     │ Analysis    │     │ (TF-IDF)    │
        └─────┬─────┘     └──────┬──────┘     └──────┬──────┘
        ┌─────┴─────┐     ┌──────┴──────┐     ┌──────┴──────┐
        │ Node 5:   │     │ Node 7:     │     │ Node 9:     │
        │ Placement │     │ Skill Gap   │     │ Drive Rec.  │
        │ Predictor │     │ Counter     │     │ Ranking     │
        │ (RF)      │     │             │     │             │
        └─────┬─────┘     └──────┬──────┘     └──────┬──────┘
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                    ══════════════════════════════
                    ║   PHASE 3b: RISK BRANCH   ║
                    ══════════════════════════════
                                  │
                           ┌──────┴───────┐
                           │ Node 10:     │
                           │ Risk Cluster │
                           │ (K-Means)    │
                           └──────┬───────┘
                                  │
                    ══════════════════════════════
                    ║   PHASE 4: SYNTHESIS      ║
                    ══════════════════════════════
                                  │
                           ┌──────┴───────┐
                           │ Node 11:     │
                           │ Score Merge  │
                           │ (Weighted    │
                           │  Average)    │
                           └──────┬───────┘
                                  │
                           ┌──────┴───────┐
                           │ Node 12:     │
                           │ Cache Write  │
                           │ + Return     │
                           └──────────────┘
                                  │
                                  ▼
                        ┌──────────────────┐
                        │    OUTPUT        │
                        │                  │
                        │ • final_score    │
                        │ • verdict        │
                        │ • 4 aspects      │
                        │ • explanation    │
                        │ • risk_level     │
                        │ • skill_gap      │
                        │ • recommendations│
                        └──────────────────┘
```

### Pipeline Execution Model

| Property | Value |
|---|---|
| **Execution Model** | Fan-out / Fan-in with `ThreadPoolExecutor` |
| **Concurrency** | Nodes 4–9 run in parallel threads |
| **Cache Strategy** | `SHA-256(student_id + today)` → `pipeline_cache` collection |
| **Cache TTL** | 24 hours (daily refresh) |
| **Cache Speedup** | ~11× (140ms → 12ms on cache hit) |
| **External APIs** | None — fully self-contained |
| **LLM Dependency** | None — deterministic ML models only |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 8.0 | Build tool & dev server |
| React Router | 7.15 | Client-side routing |
| Vanilla CSS | — | Custom design system (no Tailwind in prod) |
| Axios | 1.16 | HTTP client with JWT interceptor |
| @react-oauth/google | 0.13 | Google Sign-In button |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Runtime |
| Express | 5.2 | REST API framework |
| Mongoose | 9.6 | MongoDB ODM |
| JSON Web Token | 9.0 | Authentication (7-day expiry) |
| bcryptjs | 3.0 | Password hashing |
| Multer | 2.1 | File upload handling (memory storage) |
| Cloudinary | 1.41 | Cloud file storage (mark sheets + resumes) |
| Tesseract.js | 7.0 | OCR engine for mark sheets & image resumes |
| pdf-parse | 2.4 | PDF text extraction (resumes) |
| pdf-to-img | 6.1 | PDF → image conversion (mark sheet OCR) |
| canvas | 3.2 | Image rendering dependency for Tesseract |
| Axios | 1.16 | ML service proxy |
| Morgan | 1.10 | HTTP request logging |
| express-rate-limit | 8.5 | Brute-force protection |
| express-validator | 7.3 | Input validation |
| Nodemailer | 8.0 | Email notifications |
| google-auth-library | 10.6 | Google OAuth token verification |

### ML Service
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13 | Runtime |
| FastAPI | 0.111 | Async REST API framework |
| Uvicorn | 0.30 | ASGI server |
| PyMongo | 4.7 | Direct MongoDB driver |
| scikit-learn | 1.5 | ML algorithms (RF, K-Means, TF-IDF) |
| NumPy | 1.26 | Numerical computing |
| Pandas | 2.2 | Data manipulation |
| Joblib | 1.4 | Model serialization |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (shared cluster) |
| Cloudinary | Cloud file storage (mark sheets + resumes) |
| Vercel | Frontend hosting |
| Render | Backend + ML service hosting |

---

## 📁 Project Structure

```
Edupath_Student/
│
├── backend/                          # Node.js + Express REST API
│   ├── config/
│   │   └── db.js                     # MongoDB connection via Mongoose
│   ├── controllers/
│   │   ├── adminController.js        # Admin CRUD, dashboard, analytics
│   │   ├── applicationController.js  # Application status management
│   │   ├── authController.js         # Register, login, Google OAuth
│   │   ├── driveController.js        # Drive CRUD + eligibility filter
│   │   ├── notificationController.js # Notification broadcast & read
│   │   ├── shortlistController.js    # Bulk eligibility engine
│   │   └── studentController.js      # Profile, score, mark sheet, resume, Cloudinary
│   ├── middleware/
│   │   ├── checkRole.js              # Role-based access (student/admin)
│   │   ├── rateLimiter.js            # 100 req/15min per IP
│   │   ├── upload.js                 # Multer config (Cloudinary storage)
│   │   └── verifyToken.js            # JWT verification middleware
│   ├── models/
│   │   ├── Admin.js                  # Admin schema (email, password)
│   │   ├── Application.js            # Application schema (student↔drive)
│   │   ├── CompanyDrive.js           # Drive schema (company, skills, CGPA)
│   │   ├── Notification.js           # Notification schema
│   │   └── Student.js                # Student schema (25 fields + hooks)
│   ├── routes/
│   │   ├── admin.js                  # /api/admin/* endpoints
│   │   ├── auth.js                   # /api/auth/* endpoints
│   │   ├── ml.js                     # /api/ml/* (11 proxy endpoints)
│   │   └── student.js                # /api/student/* (13 endpoints)
│   ├── seed/
│   │   └── seed.js                   # Database seeder (admin + sample data)
│   ├── utils/
│   │   ├── scorer.js                 # Employability Score calculator
│   │   ├── ocr.js                    # Tesseract.js OCR pipeline for mark sheets
│   │   ├── resumeParser.js           # Resume text extraction + skill detection
│   │   └── ragAnswers.js             # Template-based RAG Q&A engine
│   ├── eng.traineddata               # Tesseract English language model
│   ├── server.js                     # Express app entry point
│   └── package.json
│
├── frontend/                         # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx   # Admin sidebar + header layout
│   │   │   │   └── ui.jsx            # Admin design system (Panel, Btn, etc.)
│   │   │   ├── ml/
│   │   │   │   ├── SPIEScoreCard.jsx    # Score ring + 4 aspect bars
│   │   │   │   ├── DriveRecommendations.jsx # TF-IDF ranked drives
│   │   │   │   ├── SkillGapWidget.jsx   # Missing skills by demand
│   │   │   │   └── RAGChat.jsx          # Placement Q&A chatbot
│   │   │   ├── Sidebar.jsx           # Student sidebar navigation
│   │   │   ├── ToastContainer.jsx    # Global toast notification system
│   │   │   └── ToggleSwitch.jsx      # Reusable toggle switch component
│   │   ├── context/
│   │   │   └── AppContext.js         # React context provider
│   │   ├── data/
│   │   │   ├── mockData.js           # Mock data for development
│   │   │   └── themes.js             # Theme configuration
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          # Login + Register (Student & Admin)
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx     # KPIs + analytics + ML risk panel
│   │   │   │   ├── AdminStudents.jsx      # Student list + filtering
│   │   │   │   ├── AdminDrives.jsx        # Drive CRUD interface
│   │   │   │   ├── AdminApplications.jsx  # Application management
│   │   │   │   ├── AdminReadiness.jsx     # Tier-wise readiness overview
│   │   │   │   ├── AdminVerification.jsx  # Document verification queue
│   │   │   │   └── AdminSettings.jsx      # Admin settings
│   │   │   └── student/
│   │   │       ├── Dashboard.jsx          # Student home + ML widgets
│   │   │       ├── DriveBrowser.jsx       # Browse & apply to drives
│   │   │       ├── MyApplications.jsx     # Application history
│   │   │       ├── NotificationsPage.jsx  # Notification center
│   │   │       ├── SettingsPage.jsx       # Profile editor + document uploads
│   │   │       └── ui.jsx                # Student design tokens
│   │   ├── utils/
│   │   │   ├── api.js                # Axios instance + JWT interceptor
│   │   │   ├── mlApi.js              # ML-specific API helpers
│   │   │   └── useToast.js           # Toast hook
│   │   ├── App.jsx                   # Root component + routing
│   │   ├── index.css                 # Global styles
│   │   └── main.jsx                  # Vite entry point
│   └── package.json
│
├── ml_service/                       # Python FastAPI ML microservice
│   ├── config.py                     # Environment loader (MongoDB URI, port)
│   ├── main.py                       # FastAPI app + all HTTP endpoints
│   ├── data/
│   │   └── mongo_loader.py           # PyMongo data loader (students, drives)
│   ├── models/
│   │   ├── placement_predictor.py    # Random Forest classifier
│   │   ├── drive_recommender.py      # TF-IDF + cosine similarity
│   │   ├── risk_clusterer.py         # K-Means (3 clusters)
│   │   └── skill_gap.py             # Set-difference skill counter
│   ├── pipeline/
│   │   ├── state.py                  # Pipeline state dataclass
│   │   ├── graph.py                  # 12-node StateGraph builder
│   │   └── nodes/
│   │       ├── phase1_ingestion.py   # Cache check + data loading
│   │       ├── phase2_decompose.py   # Feature extraction
│   │       ├── phase3_parallel.py    # 4 parallel analysis branches
│   │       └── phase4_synthesis.py   # Score merge + cache write
│   ├── rag/
│   │   ├── retriever.py             # TF-IDF retrieval from MongoDB
│   │   └── answerer.py              # Template-based answer generator
│   ├── ocr/
│   │   └── extractor.py             # Tesseract + Pillow mark sheet OCR
│   ├── saved_models/                 # Serialized .pkl model files
│   ├── test_ml.py                    # 46-test comprehensive test suite
│   ├── test_cache.py                 # Cache-specific tests
│   └── requirements.txt
│
├── .gitignore
└── README.md                         # ← You are here
```

---

## 🗄 Database Schema

### Student Collection
```javascript
{
  roll_no:             String,      // Unique roll number
  full_name:           String,      // Full name
  email:               String,      // Unique, lowercase
  password:            String,      // bcrypt hash (null if Google OAuth)
  google_id:           String,      // Google OAuth ID
  branch:              String,      // "CSE", "IT", "ECE", etc.
  year:                String,      // "1st Year" .. "4th Year"
  cgpa:                Number,      // 0.0 – 10.0
  active_backlogs:     Number,      // Count of active backlogs
  dsa_marks:           Number,      // 0 – 100
  oops_marks:          Number,      // 0 – 100
  readiness_score:     Number,      // Auto-calculated (pre-save hook)
  tier:                String,      // "Tier1" | "Tier2" | "Tier3"
  skills:              [String],    // ["Python", "React", "SQL"]
  mark_sheet_url:      String,      // Cloudinary URL for uploaded mark sheet
  mark_sheet_public_id: String,     // Cloudinary public ID for deletion
  resume_url:          String,      // Cloudinary URL for uploaded resume
  resume_public_id:    String,      // Cloudinary public ID for deletion
  verification_status: String,      // "Pending" | "Approved" | "Rejected"
  rejection_count:     Number,      // Interview rejection counter
  avatar:              String,      // Auto-generated initials
  timestamps:          true         // createdAt, updatedAt
}
```

### CompanyDrive Collection
```javascript
{
  admin_id:             ObjectId,   // Creator admin reference
  company_name:         String,     // "TCS", "Infosys", etc.
  job_role:             String,     // "SDE", "Data Analyst", etc.
  min_cgpa_required:    Number,     // Minimum CGPA threshold
  max_backlogs_allowed: Number,     // Maximum backlogs allowed
  required_skills:      [String],   // ["Java", "SQL", "AWS"]
  visit_date:           Date,       // Campus visit date
  avg_package:          String,     // "6.5 LPA"
  location:             String,     // Office location
  status:               String,     // "Upcoming" | "Active" | "Completed" | "Cancelled"
  applications_count:   Number,     // Auto-incremented on apply
  timestamps:           true
}
```

### Application Collection
```javascript
{
  student_id:       ObjectId,       // → Student
  drive_id:         ObjectId,       // → CompanyDrive
  application_date: Date,           // Default: now
  status:           String,         // "Applied" | "Shortlisted" | "Selected" | "Rejected"
  rejection_round:  String,         // "Coding Round", "HR Interview", etc.
  feedback:         String,         // Admin note
  // Unique compound index: (student_id, drive_id)
}
```

### Notification Collection
```javascript
{
  student_id:  ObjectId,            // → Student
  title:       String,              // Notification title
  message:     String,              // Notification body
  type:        String,              // "drive" | "verification" | "application" | "system"
  read:        Boolean,             // Read status (default: false)
  timestamps:  true
}
```

### Pipeline Cache Collection (ML)
```javascript
{
  _id:        String,               // SHA-256(student_id + today)
  result:     Object,               // Full SPIE pipeline output
  created_at: DateTime,             // UTC timestamp
  // TTL: 24 hours (checked on read)
}
```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/student/register` | — | Register new student |
| `POST` | `/student/login` | — | Login with email + password |
| `POST` | `/admin/login` | — | Admin login |
| `POST` | `/google` | — | Google OAuth sign-in |
| `POST` | `/reset-password` | — | Password reset |

### Student Routes (`/api/student`) — JWT + Student Role
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/profile` | Get student profile |
| `PATCH` | `/profile` | Update profile fields |
| `PUT` | `/change-password` | Change password |
| `GET` | `/readiness-score` | Get employability score |
| `POST` | `/upload-marksheet` | Upload mark sheet (PDF/JPG/PNG) + OCR |
| `DELETE` | `/marksheet` | Remove mark sheet |
| `POST` | `/upload-resume` | Upload resume (PDF/DOCX/TXT/JPG/PNG) + skill detection |
| `DELETE` | `/resume` | Remove resume |
| `GET` | `/drives` | List all drives |
| `GET` | `/eligible-drives` | List drives you qualify for |
| `POST` | `/apply` | Apply to a drive |
| `GET` | `/applications` | Your applications |
| `GET` | `/notifications` | Your notifications |
| `PATCH` | `/notifications/:id/read` | Mark notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read |

### Admin Routes (`/api/admin`) — JWT + Admin Role
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Dashboard KPIs and analytics |
| `GET` | `/stats/students` | Student statistics |
| `GET` | `/stats/drives` | Drive statistics |
| `GET` | `/stats/placements` | Placement statistics |
| `GET` | `/stats/pending` | Pending items count |
| `GET` | `/analytics/placements` | Detailed placement analytics |
| `GET` | `/students` | All students (with mark_sheet_url, resume_url) |
| `GET` | `/students/:id` | Student by ID |
| `PATCH` | `/verify/:id` | Approve/reject student documents |
| `GET` | `/flagged-students` | Flagged students list |
| `GET` | `/drives` | All drives (admin view) |
| `POST` | `/drives` | Create new drive |
| `PUT` | `/drives/:id` | Edit drive |
| `DELETE` | `/drives/:id` | Delete drive |
| `GET` | `/drives/:id/applications` | Applications for a drive |
| `GET` | `/applications` | All applications |
| `PATCH` | `/applications/:id/status` | Update application status |
| `POST` | `/shortlist` | Run bulk eligibility engine |
| `POST` | `/notify/:drive_id` | Send drive notification |

### ML Proxy Routes (`/api/ml`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | ML service health check |
| `GET` | `/insights` | Student | Full SPIE pipeline result |
| `DELETE` | `/insights/refresh` | Student | Clear cache + re-run pipeline |
| `GET` | `/recommend` | Student | TF-IDF drive recommendations |
| `GET` | `/risk` | Student | K-Means risk assessment |
| `GET` | `/skill-gap` | Student | Missing skills ranked by demand |
| `POST` | `/rag` | Any | RAG question answering |
| `POST` | `/ocr` | Any | Mark sheet OCR extraction |
| `GET` | `/admin/insights/:id` | Admin | Pipeline for any student |
| `GET` | `/admin/batch-risk` | Admin | Risk levels for all students |
| `POST` | `/admin/train` | Admin | Retrain all ML models |

---

## 🧠 ML Models Deep Dive

### 1. Placement Predictor — Random Forest

| Property | Value |
|---|---|
| **Algorithm** | `RandomForestClassifier` (scikit-learn) |
| **Features** | CGPA, DSA marks, OOPs marks, active backlogs, skill count, readiness score |
| **Target** | Binary — placed (1) or not placed (0) |
| **Output** | Probability 0.0–1.0 + confidence level |
| **Training Data** | Student records from MongoDB |
| **Serialization** | Joblib `.pkl` file |

### 2. Drive Recommender — TF-IDF

| Property | Value |
|---|---|
| **Algorithm** | `TfidfVectorizer` + `cosine_similarity` |
| **Input** | Student skills (joined as text) vs. drive required skills |
| **Output** | Ranked list of drives with match_score (0–100%), match_label, eligibility |
| **Labels** | "Excellent Match" (>70%), "Good Match" (>40%), "Fair Match" (>15%), "Low Match" |

### 3. Risk Clusterer — K-Means

| Property | Value |
|---|---|
| **Algorithm** | `KMeans` (k=3) |
| **Features** | CGPA, backlogs, readiness score, skill count |
| **Output** | Cluster label mapped to "High Risk", "Medium Risk", or "Low Risk" |
| **Cluster Mapping** | Based on centroid CGPA values (lowest CGPA centroid = High Risk) |

### 4. Skill Gap Analyzer — Set Difference

| Property | Value |
|---|---|
| **Algorithm** | Set difference + demand counter |
| **Input** | Student skills vs. all drive required skills |
| **Output** | Missing skills ranked by demand count, coverage percentage |
| **Demand Count** | Number of eligible drives that require each missing skill |

### 5. RAG Retriever — TF-IDF from MongoDB

| Property | Value |
|---|---|
| **Algorithm** | TF-IDF vectorization of drive descriptions |
| **Data Source** | `companydrives` and `students` collections |
| **Query Flow** | Query → TF-IDF → cosine similarity → top-k docs → template answer |
| **External API** | None — fully local |

---

## 📄 OCR & Document Processing

### Mark Sheet OCR Pipeline (Node.js — `ocr.js`)

| Property | Value |
|---|---|
| **Engine** | Tesseract.js 7.0 (runs in Node.js, no system binary needed) |
| **Language Model** | `eng.traineddata` (bundled in repo) |
| **PDF Support** | `pdf-to-img` converts PDF pages → PNG images at 3× scale (~216 DPI) |
| **Image Support** | Direct Tesseract recognition on JPG, PNG, WEBP, BMP |
| **Max Pages** | 3 pages per PDF (for speed) |
| **Extracted Fields** | CGPA, backlogs, DSA marks, OOPs marks, year, branch, roll number |
| **Parsing Algorithm** | `COMMON_MAX` whitelist (100, 50, 75, 60, 80) prevents subject codes from being misidentified as max marks |

### Resume Skill Detection (`resumeParser.js`)

| Property | Value |
|---|---|
| **PDF Text** | Extracted via `pdf-parse` (native text layer) |
| **Image Text** | Extracted via Tesseract.js OCR |
| **DOCX/TXT** | UTF-8 string fallback |
| **Skill Dictionary** | 12 canonical skills matched via regex patterns |
| **Supported Skills** | Python, Java, JavaScript, React, Node.js, SQL, MongoDB, C++, Flutter, Machine Learning, DSA, UI/UX |
| **Merge Strategy** | Detected skills are additively merged with existing profile skills (no duplicates) |

### File Storage (Cloudinary)

| Property | Value |
|---|---|
| **Upload Method** | Memory buffer → temp file → Cloudinary upload → delete temp |
| **Mark Sheets** | Folder: `edupath_marksheets`, resource_type: `raw` (PDF) or `image` |
| **Resumes** | Folder: `edupath_resumes`, resource_type: `raw` (PDF) or `image` |
| **Viewing** | PDFs via Google Docs Viewer, images via direct Cloudinary URL |
| **Deletion** | Cloudinary `uploader.destroy()` on mark sheet/resume removal |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| **Python** | ≥ 3.10 | [python.org](https://python.org/) |
| **MongoDB Atlas** | Free tier | [cloud.mongodb.com](https://cloud.mongodb.com/) |
| **Git** | ≥ 2.x | [git-scm.com](https://git-scm.com/) |

> **Note:** Tesseract OCR is bundled via `tesseract.js` — no system-level installation required.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Deepanghsh/Edupath.git
cd Edupath
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# ML Service
cd ../ml_service
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Create the following `.env` files (see [Environment Variables](#-environment-variables) section):

- `backend/.env`
- `ml_service/.env`
- `frontend/.env` (optional)

### Step 4: Seed the Database

```bash
cd backend
node seed/seed.js
```

This creates a default admin account: `admin@college.edu` / `admin123`

### Step 5: Start All Services

Open **3 terminal windows**:

```bash
# Terminal 1 — ML Service (start first)
cd ml_service
python main.py
# → FastAPI running on http://localhost:8000

# Terminal 2 — Backend
cd backend
node server.js
# → Express running on http://localhost:5000

# Terminal 3 — Frontend
cd frontend
npm run dev
# → Vite running on http://localhost:5173
```

---

## 🔐 Environment Variables

### `backend/.env`

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=EduPath
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
ML_SERVICE_URL=http://localhost:8000

# Google OAuth — get your Client ID from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary — cloud file storage for mark sheets & resumes
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### `ml_service/.env`

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=EduPath
DB_NAME=test
PORT=8000
```

> ⚠️ **Important:** `DB_NAME` in `ml_service/.env` must match the database Mongoose writes to. By default, Mongoose uses `test` unless you specify a database name in the connection string.

### `frontend/.env` (optional)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🏃 Running the Application

| Service | Command | Port | URL |
|---|---|---|---|
| ML Service | `cd ml_service && python main.py` | 8000 | http://localhost:8000 |
| Backend | `cd backend && node server.js` | 5000 | http://localhost:5000 |
| Frontend | `cd frontend && npm run dev` | 5173 | http://localhost:5173 |

> **Startup order matters:** Start ML Service → Backend → Frontend.
> The backend will log `🤖 ML Service: http://localhost:8000` if connected properly.

---

## 🚀 Deployment

### Current Production Setup

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [edupath-peach.vercel.app](https://edupath-peach.vercel.app) |
| **Backend** | Render | [edupath-z2sy.onrender.com](https://edupath-z2sy.onrender.com) |
| **ML Service** | Render | [edupath-ml.onrender.com](https://edupath-ml.onrender.com) |
| **Database** | MongoDB Atlas | Shared cluster |
| **File Storage** | Cloudinary | Auto-managed CDN |

### Deployment Notes

- **Backend on Render:** Uses `npm install` as build command and `node server.js` as start command. All file uploads use memory buffers (no local disk writes) since Render has ephemeral storage.
- **Frontend on Vercel:** Auto-deploys from the `frontend/` directory on push to `main`. Set `VITE_API_URL` to the Render backend URL.
- **ML Service on Render:** Uses `pip install -r requirements.txt` and `python main.py`. Shares the same MongoDB Atlas cluster as the backend.

---

## 🧪 Testing

### ML Test Suite

```bash
cd ml_service
python test_ml.py
```

This runs **46 tests** covering:
- Config & imports
- MongoDB connectivity
- All 4 ML models (predict, recommend, risk, skill-gap)
- RAG query engine
- OCR extractor
- Full SPIE pipeline (with and without cache)
- HTTP endpoint tests (FastAPI)
- Performance benchmarks

### Backend Health Check

```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "timestamp": "..." }

curl http://localhost:5000/api/ml/health
# → { "status": "ok", "models": {...}, "ml_service_url": "http://localhost:8000" }
```

---

## 📐 Scoring Formula

### Employability Score (Backend — pre-save hook)

```
ES = (Academic × 0.4) + (Technical × 0.3) + (Aptitude × 0.3)

Where:
  Academic  = (CGPA / 10) × 100          → normalized to 0–100
  Technical = (DSA_marks + OOPs_marks) / 2
  Aptitude  = 50                          → default until aptitude tests integrated
```

### Tier Classification

| Tier | Score Range | Label |
|---|---|---|
| **Tier 1** | ES ≥ 80 | 🏆 Core Ready |
| **Tier 2** | 50 ≤ ES < 80 | ⚡ Mass Ready |
| **Tier 3** | ES < 50 | 📚 Training Mode |

### SPIE Final Score (ML Pipeline)

```
SPIE Score = Σ (aspect_score × aspect_weight) across 4 aspects

Aspects:
  Academic   → CGPA normalized + backlog penalty
  Technical  → DSA + OOPs + skill count factor
  MarketFit  → TF-IDF match score against active drives
  Risk       → Inverse of risk cluster distance

Verdict mapping:
  ≥ 80  → "Placement Ready"
  ≥ 65  → "Strong Candidate"
  ≥ 45  → "Conditionally Ready"
  ≥ 25  → "Needs Improvement"
  < 25  → "High Risk"
```

---

## 📸 Screenshots

> Screenshots will be added in future updates.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📜 License

This project is developed as part of the **Software Engineering & Project Management (SEPM)** course at Goa Engineering College.

---

<p align="center">
  <sub>Built with ❤️ by the EduPath Team — GEC 2025</sub>
</p>
