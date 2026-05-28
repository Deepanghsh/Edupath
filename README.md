<p align="center">
  <img src="https://img.shields.io/badge/EduPath-SPIE-1e5fa8?style=for-the-badge&logo=mortarboard&logoColor=white" alt="EduPath" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn" />
</p>

# 🎓 EduPath — AI-Powered Student Placement Intelligence Engine

> A full-stack placement management system with a deterministic 12-node ML pipeline (SPIE) that predicts placement readiness, recommends drives, clusters risk, identifies skill gaps, and answers placement queries — all without any external API, LLM, or paid service.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [ML Pipeline — SPIE Architecture](#-ml-pipeline--spie-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [ML Models Deep Dive](#-ml-models-deep-dive)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
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
1. **Self-service student portal** with real-time drive eligibility, application tracking, and profile management.
2. **Admin dashboard** for drive management, bulk eligibility engine, student verification, and analytics.
3. **SPIE (Student Placement Intelligence Engine)** — a deterministic ML pipeline that runs 4 models in parallel to produce an actionable placement readiness score.

---

## ✨ Key Features

### 🧑‍🎓 Student Portal
| Feature | Description |
|---|---|
| **JWT + Google OAuth** | Secure login with email/password or Google Sign-In |
| **Profile & Settings** | Edit CGPA, backlogs, DSA/OOPs marks, skills, mark sheet upload |
| **Employability Score** | Auto-calculated on every profile save using weighted formula |
| **Drive Browser** | View all active drives with eligibility status per drive |
| **1-Click Apply** | Apply to eligible drives directly from the browser |
| **Application Tracker** | Track status: Applied → Shortlisted → Selected / Rejected |
| **Notifications** | Real-time notifications for drive updates and results |
| **SPIE Score Card** | AI-generated placement readiness score with 4 aspect breakdown |
| **Drive Recommendations** | TF-IDF ranked drives matched to your skill profile |
| **Skill Gap Analysis** | Missing skills ranked by how many drives demand them |
| **RAG Chat** | Ask placement questions — answered from MongoDB data, no LLM |
| **Mark Sheet OCR** | Upload mark sheet image → auto-extract CGPA via Tesseract |

### 🔑 Admin Dashboard
| Feature | Description |
|---|---|
| **Dashboard KPIs** | Total students, drives, applications, placement rate at a glance |
| **Student Management** | View, verify, flag students with document verification workflow |
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
| **OCR Engine** | Tesseract + Pillow preprocessing for mark sheet extraction |
| **RAG Retriever** | TF-IDF retrieval from MongoDB — no external API needed |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                        │
│                                                                 │
│   React 19 + Vite + React Router + Tailwind CSS                │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│   │ AuthPage │ │ Student  │ │  Admin   │ │ ML       │         │
│   │ (Login/  │ │ Dashboard│ │ Dashboard│ │ Widgets  │         │
│   │ Register)│ │ + Drives │ │ + CRUD   │ │ (5 JSX)  │         │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│        │             │            │             │               │
│        └─────────────┴────────────┴─────────────┘               │
│                         │  Axios + JWT                          │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express 5)                │
│                     http://localhost:5000                       │
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
└────────────────────────────────┬────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   MongoDB Atlas  │  │ File System     │  │ ML SERVICE (FastAPI) │
│                  │  │ /uploads/       │  │ http://localhost:8000│
│ Collections:     │  │ Mark sheets     │  │                     │
│ • students       │  │ stored locally  │  │ 12-Node SPIE        │
│ • admins         │  │ or Cloudinary   │  │ Pipeline             │
│ • companydrives  │  └─────────────────┘  │                     │
│ • applications   │                       │ PyMongo (direct)     │
│ • notifications  │◄──────────────────────┤ reads same DB       │
│ • pipeline_cache │                       │                     │
└──────────────────┘                       └─────────────────────┘
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
Axios POST to http://localhost:8000/pipeline/run { student_id }
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
| Tailwind CSS | 3.4 | Utility-first styling |
| Axios | 1.16 | HTTP client with JWT interceptor |
| @react-oauth/google | 0.13 | Google Sign-In button |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22.x | Runtime |
| Express | 5.2 | REST API framework |
| Mongoose | 9.6 | MongoDB ODM |
| JSON Web Token | 9.0 | Authentication (7-day expiry) |
| bcryptjs | 3.0 | Password hashing |
| Multer | 2.1 | File upload handling |
| Axios | 1.16 | ML service proxy |
| Morgan | 1.10 | HTTP request logging |
| express-rate-limit | 8.5 | Brute-force protection |
| express-validator | 7.3 | Input validation |
| Nodemailer | 8.0 | Email notifications |
| Cloudinary | 1.41 | Cloud image storage (optional) |
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
| pytesseract | 0.3 | OCR engine wrapper |
| Pillow | 10.3 | Image preprocessing |
| pdf2image | 1.17 | PDF → image conversion for OCR |

### Database & Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (shared cluster) |
| Tesseract OCR | Local OCR engine (system-level) |

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
│   │   └── studentController.js      # Profile, score, mark sheet
│   ├── middleware/
│   │   ├── checkRole.js              # Role-based access (student/admin)
│   │   ├── rateLimiter.js            # 100 req/15min per IP
│   │   ├── upload.js                 # Multer config (local/Cloudinary)
│   │   └── verifyToken.js            # JWT verification middleware
│   ├── models/
│   │   ├── Admin.js                  # Admin schema (email, password)
│   │   ├── Application.js            # Application schema (student↔drive)
│   │   ├── CompanyDrive.js           # Drive schema (company, skills, CGPA)
│   │   ├── Notification.js           # Notification schema
│   │   └── Student.js                # Student schema (22 fields + hooks)
│   ├── routes/
│   │   ├── admin.js                  # /api/admin/* (15 endpoints)
│   │   ├── auth.js                   # /api/auth/* (5 endpoints)
│   │   ├── ml.js                     # /api/ml/* (11 proxy endpoints)
│   │   └── student.js                # /api/student/* (11 endpoints)
│   ├── seed/
│   │   └── seed.js                   # Database seeder (admin + sample data)
│   ├── utils/
│   │   └── scorer.js                 # Employability Score calculator
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
│   │   │   └── ToastContainer.jsx    # Global toast notification system
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          # Login + Register (Student & Admin)
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx     # KPIs + analytics + ML risk panel
│   │   │   │   ├── AdminStudents.jsx      # Student list + verification
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
│   │   │       ├── SettingsPage.jsx       # Profile editor + mark sheet
│   │   │       └── ui.jsx                # Student design tokens
│   │   ├── utils/
│   │   │   ├── api.js                # Axios instance + JWT interceptor
│   │   │   ├── mlApi.js              # ML-specific API helpers
│   │   │   └── useToast.js           # Toast hook
│   │   ├── App.jsx                   # Root component + routing
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
  mark_sheet_url:      String,      // Uploaded mark sheet URL
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
| `POST` | `/upload-marksheet` | Upload mark sheet image |
| `GET` | `/drives` | List all drives |
| `GET` | `/eligible-drives` | List drives you qualify for |
| `POST` | `/apply` | Apply to a drive |
| `GET` | `/applications` | Your applications |
| `GET` | `/notifications` | Your notifications |
| `PATCH` | `/notifications/:id/read` | Mark notification as read |

### Admin Routes (`/api/admin`) — JWT + Admin Role
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Dashboard KPIs and analytics |
| `GET` | `/stats/students` | Student statistics |
| `GET` | `/stats/drives` | Drive statistics |
| `GET` | `/stats/placements` | Placement statistics |
| `GET` | `/stats/pending` | Pending items count |
| `GET` | `/analytics/placements` | Detailed placement analytics |
| `GET` | `/students` | All students |
| `GET` | `/students/:id` | Student by ID |
| `PATCH` | `/verify/:id` | Approve/reject student |
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

### ML Service Direct Endpoints (port 8000)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health + model status |
| `POST` | `/pipeline/run` | Run full SPIE pipeline |
| `DELETE` | `/pipeline/invalidate/:id` | Clear student cache |
| `GET` | `/ml/predict/:id` | Placement probability (RF) |
| `GET` | `/ml/recommend/:id` | Drive recommendations (TF-IDF) |
| `GET` | `/ml/risk/:id` | Risk cluster (K-Means) |
| `GET` | `/ml/skill-gap/:id` | Skill gap analysis |
| `POST` | `/ml/train` | Retrain all models |
| `POST` | `/rag/query` | RAG question answering |
| `POST` | `/ocr/extract` | Mark sheet OCR |

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

### 6. OCR Engine — Tesseract + Pillow

| Property | Value |
|---|---|
| **Engine** | Tesseract OCR (local system binary) |
| **Preprocessing** | Grayscale → Sharpen → Contrast Enhance → Resize |
| **Supported Formats** | JPEG, PNG, PDF (via pdf2image) |
| **Extracted Fields** | CGPA/GPA, roll number, backlogs (via regex) |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Installation |
|---|---|---|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org/) |
| **Python** | ≥ 3.10 | [python.org](https://python.org/) |
| **MongoDB Atlas** | Free tier | [cloud.mongodb.com](https://cloud.mongodb.com/) |
| **Tesseract OCR** | ≥ 5.x | [github.com/tesseract-ocr](https://github.com/tesseract-ocr/tesseract) |
| **Git** | ≥ 2.x | [git-scm.com](https://git-scm.com/) |

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

# Optional — Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Optional — Cloudinary (for cloud mark sheet storage)
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
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_USE_CLOUDINARY=false
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
