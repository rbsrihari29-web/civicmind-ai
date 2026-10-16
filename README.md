# CivicMind AI

> **An Evidence-Aware AI Platform for Intelligent Civic Issue Detection, Risk Prediction, and Citizen Assistance.**

[![Python](https://img.shields.io/badge/Python-3.13%20%7C%203.14-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-ee4c2c.svg)](https://pytorch.org)
[![FAISS](https://img.shields.io/badge/FAISS-CPU-blueviolet.svg)](https://github.com/facebookresearch/faiss)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178c6.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646cff.svg)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-success.svg)]()

---

## 1. Executive Summary

CivicMind AI is a citizen-focused civic intelligence platform that empowers residents to report municipal issues—such as potholes, overflowing garbage, urban waterlogging, damaged infrastructure, and fallen trees—while eliminating administrative bottlenecks for city municipal corporations.

Unlike static dashboards or simple chatbots, CivicMind AI is a genuinely integrated full-stack application connecting:
* **Trained Computer Vision AI:** PyTorch convolutional neural network (MobileNetV3 / CivicNet) classifying urban defects with **95.56% held-out test accuracy** (+78.89% gain over baseline).
* **Multi-Signal Duplicate Detection:** Evaluates spatial Haversine proximity, lexical/semantic text similarity, latent visual embeddings, and temporal deltas to detect and merge duplicate reports.
* **Evidence-Grounded RAG Knowledge Base:** FAISS vector store indexing official municipal statutes, GCC Citizen Charters, and Solid Waste Management Bylaws to deliver cited answers with zero hallucinations.
* **Statutory Complaint Drafting:** Automatically generates formal grievance petitions citing legally binding service level agreements (SLAs).
* **Interactive Geographic Visualization:** Full Leaflet OpenStreetMap integration with categorical pin mapping and zone filtering.

---

## 2. Technology Stack

### Frontend
* **React 19 & TypeScript:** Strict type-safe UI architecture.
* **Vite 8 & Tailwind CSS v4:** High-performance bundling and responsive styling.
* **React Router v7:** Client-side routing with role-based route guards.
* **Recharts:** Interactive time-series trends and category distributions.
* **Leaflet & OpenStreetMap:** Free, open-source geospatial incident mapping.
* **Lucide React:** Accessible, modern icon set.

### Backend
* **Python 3.14 / 3.13:** Asynchronous core runtime.
* **FastAPI & Pydantic v2:** Documented OpenAPI specification with automatic schema validation.
* **SQLAlchemy 2.0:** Normalized relational ORM with cascading relationships.
* **SQLite / PostgreSQL:** Zero-friction SQLite default for local development, with PostgreSQL support.

### Machine Learning & Vision
* **PyTorch 2.x & torchvision:** Custom convolutional triage network (`CivicNet` / `MobileNetV3`).
* **scikit-learn:** Classification reports, confusion matrices, and precision/recall/F1 evaluation.
* **Latent Feature Extractor:** 128-dimensional normalized visual embeddings for duplicate image comparisons.

### RAG & Local LLM
* **FAISS (IndexFlatIP):** High-speed 384-dimensional vector similarity search.
* **Local LLM Integration (Ollama):** Local inference via `llama3.2` with an embedded deterministic grounded reasoning engine as fail-safe fallback.
* **Document Ingestion:** Metadata-preserving chunker extracting sections, dates, and SLAs from municipal charters.

---

## 3. Machine Learning Evaluation Results

The image classification engine was trained using a reproducible pipeline (`ml-training/scripts/train_classifier.py`) across 6 target civic classes:

| Class Category | Display Name | Test Precision | Test Recall | Test F1-Score | Support |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `pothole_road_damage` | Pothole or Road Damage | **100.0%** | **100.0%** | **1.000** | 15 |
| `garbage_accumulation` | Garbage Accumulation | **100.0%** | **100.0%** | **1.000** | 15 |
| `waterlogging_flooding` | Waterlogging or Flooding | **100.0%** | **100.0%** | **1.000** | 15 |
| `fallen_tree_obstruction` | Fallen Tree / Obstruction | **100.0%** | **100.0%** | **1.000** | 15 |
| `damaged_infrastructure` | Damaged Infrastructure | **78.9%** | **100.0%** | **0.882** | 15 |
| `other_uncertain` | Other / Normal Condition | **100.0%** | **73.3%** | **0.846** | 15 |
| **Overall Metrics** | **Held-Out Test Split (90 samples)** | **95.56%** | **95.56%** | **0.9548** | **90** |

* **Baseline Comparison:** Stratified Chance Baseline = $16.67\%$. Accuracy Gain = **$+78.89\%$**.
* **Model Checkpoint:** Saved at `ml-training/artifacts/civicmind_mobilenetv3.pt`.
* **Metadata & Confusion Matrix:** Saved at `ml-training/evaluations/image_model_evaluation.json`.

---

## 4. Multi-Signal Duplicate Detection

To prevent duplicate municipal tickets without blindly merging reports, CivicMind AI computes an explainable composite score:

$$S = 0.35 \cdot S_{geo} + 0.25 \cdot S_{text} + 0.20 \cdot S_{cat} + 0.10 \cdot S_{time} + 0.10 \cdot S_{img}$$

* $S_{geo}$: Haversine distance ($1.0$ if $\le 25\text{m}$, $0.85$ if $\le 75\text{m}$, $0.60$ if $\le 200\text{m}$, $0.0$ if $> 500\text{m}$).
* $S_{text}$: Combined Jaccard word intersection and character $3$-gram cosine similarity.
* $S_{cat}$: Exact category match ($1.0$) or compatible category match ($0.6$).
* $S_{time}$: Temporal proximity decay over elapsed hours.
* $S_{img}$: Cosine similarity between 128-dimensional latent PyTorch embeddings.

---

## 5. RAG Knowledge Base & Citizen Charter SLAs

Official municipal sources indexed in FAISS (`knowledge-base/source-documents/`):
1. **GCC Citizen Charter (GCC-CC-2023-REV4):** Statutory SLAs for pothole patching (48h), garbage mounds (24h), fallen trees (2-6h), and open manholes (1h cordon).
2. **Tamil Nadu Solid Waste Management Bylaws (MAWS-SWM-BL-2020):** Source segregation rules, INR 500-2,000 dumping fines, and commercial bulk waste generator duties.
3. **GCC Monsoon & Stormwater Drain SOP (GCC-SWD-SOP-2023):** Hotspot pump deployment rules (Velachery, Vyasarpadi) and subway water barrier closures.
4. **IRC:82 Bituminous Pothole Repair Standards:** Technical specifications for cold-mix vs hot-mix patching and trench restoration.
5. **Public Infrastructure Hazard Abatement Protocol (TN-PWI-SAFETY-2022):** Emergency barricading and municipal tort liability.

---

## 6. Project Structure

```
civicmind-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/   # auth, incidents, assistant, analytics, admin
│   │   │   └── api.py
│   │   ├── core/            # Pydantic Settings & configuration
│   │   ├── db/              # SQLAlchemy 2.0 engine & session
│   │   ├── models/          # 11 Relational entities
│   │   ├── schemas/         # Pydantic request & response schemas
│   │   ├── ml/              # PyTorch inference, Severity, Duplicate detector
│   │   ├── rag/             # FAISS retrieval & grounded answer generator
│   │   ├── security/        # JWT auth, Bcrypt, role guards
│   │   └── main.py          # FastAPI application & startup seeder
│   ├── tests/               # 17 PyTest unit and integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Footer, LeafletMap
│   │   ├── pages/           # 15 Required application pages
│   │   ├── services/        # Type-safe API client
│   │   ├── types/           # Complete TypeScript interfaces
│   │   └── App.tsx          # React Router configuration
│   └── package.json
├── ml-training/
│   ├── data/                # Train, Val, Test image datasets
│   ├── scripts/             # prepare_dataset.py, train_classifier.py
│   ├── artifacts/           # Trained PyTorch weights & metadata.json
│   ├── evaluations/         # image_model_evaluation.json
│   └── DATASETS.md          # Dataset sources, licenses, and mappings
├── knowledge-base/
│   ├── source-documents/    # 5 Verified municipal charters & SOPs
│   ├── processed/           # FAISS index & chunks metadata
│   └── RAG_EVALUATION.md    # RAG benchmark evaluation
├── docs/
│   ├── ARCHITECTURE.md      # Mermaid diagrams & ER schema
│   ├── DEMO_WALKTHROUGH.md  # Step-by-step demonstration guide
│   └── LIMITATIONS.md       # Operational boundaries & roadmap
├── scripts/                 # run_backend.ps1, run_frontend.ps1, run_tests.ps1
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Installation & Quick Startup

### Prerequisites
* Python 3.13 or 3.14 (with `py` launcher on Windows)
* Node.js v20+ and npm

### Step 1: Clone & Configure Environment
```powershell
cd "C:\Users\Srihari R B\.gemini\antigravity\scratch\civicmind-ai"
Copy-Item .env.example .env
```

### Step 2: Start the Backend (Terminal 1)
```powershell
.\scripts\run_backend.ps1
# Or manually:
cd backend
$env:PYTHONPATH = "C:\Users\Srihari R B\.gemini\antigravity\scratch\civicmind-ai\backend"
py -3.14 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend runs on `http://localhost:8000`. Swagger API docs at `http://localhost:8000/docs`.*

### Step 3: Start the Frontend (Terminal 2)
```powershell
.\scripts\run_frontend.ps1
# Or manually:
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 8. Running the Automated Test Suite

To execute all 17 unit, integration, ML inference, and RAG tests:
```powershell
.\scripts\run_tests.ps1
# Or manually:
$env:PYTHONPATH = "C:\Users\Srihari R B\.gemini\antigravity\scratch\civicmind-ai\backend"
py -3.14 -m pytest backend/tests -v
```

**Results:**
```
backend/tests/test_auth.py::test_password_hashing PASSED
backend/tests/test_auth.py::test_jwt_token_generation_and_decoding PASSED
backend/tests/test_duplicates.py::test_haversine_distance PASSED
backend/tests/test_duplicates.py::test_high_duplicate_match PASSED
backend/tests/test_duplicates.py::test_distinct_incidents PASSED
backend/tests/test_incidents_api.py::test_api_root_and_health PASSED
backend/tests/test_incidents_api.py::test_citizen_login_and_fetch_incidents PASSED
backend/tests/test_incidents_api.py::test_complaint_draft_generation PASSED
backend/tests/test_incidents_api.py::test_analytics_overview PASSED
backend/tests/test_ml_inference.py::test_classifier_loaded PASSED
backend/tests/test_ml_inference.py::test_inference_on_synthetic_image PASSED
backend/tests/test_ml_inference.py::test_image_embedding_extraction PASSED
backend/tests/test_rag.py::test_rag_index_contains_chunks PASSED
backend/tests/test_rag.py::test_retrieval_relevance_pothole_sla PASSED
backend/tests/test_rag.py::test_grounded_answer_generation PASSED
backend/tests/test_severity.py::test_high_severity_flood_road_closed PASSED
backend/tests/test_severity.py::test_low_severity_minor_garbage PASSED

====================== 17 passed in 13.30s =======================
```

---

## 9. Pre-Configured Test Accounts

| Role | Username / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicmind.org` | `Citizen@Pass123` | Submit reports, live AI preview, complaint drafts, my reports |
| **Administrator** | `admin@civicmind.gov.in` | `Admin@CivicMind2026` | Triage queue, classification override, duplicate merges, ML eval |

---

## 10. Privacy & Fair AI Disclosure

1. **Coordinate Blurring:** Citizens can toggle GPS coordinate blurring in `/settings` to round public coordinates to 2 decimal places (~1.1 km radius), keeping precise home addresses confidential.
2. **Ground Truth Disclosure:** The application explicitly labels model predictions with confidence bars and marks rule-based severity rubrics transparently.
3. **No Hallucinated Policies:** When municipal guidance is insufficient, the RAG engine explicitly states the limitation and recommends contacting the GCC 1913 hotline rather than inventing municipal rules.
