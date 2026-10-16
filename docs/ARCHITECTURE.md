# CivicMind AI: System Architecture & Design Specification

CivicMind AI is an evidence-aware full-stack platform for civic defect triage, multi-signal duplicate detection, statutory grievance guidance, and municipal operations.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React 19 + TypeScript + Vite + Tailwind CSS)"]
        UI_Citizen["Citizen Portal\n- Photo Upload & Live AI Preview\n- Leaflet GPS Map Pinning\n- Complaint Draft Generator\n- Civic AI Consultation"]
        UI_Admin["Administrator Hub\n- Triage Queue & Override\n- Duplicate Review & Merges\n- Recharts Analytics\n- FAISS Document Management"]
    end

    subgraph API_Gateway ["Backend Gateway (FastAPI + Pydantic v2)"]
        AuthService["Authentication & RBAC\n(JWT, Bcrypt, Role Guards)"]
        IncidentRouter["Incident & Uploads API\n(/api/incidents)"]
        AssistantRouter["Civic AI & Drafting API\n(/api/assistant)"]
        AnalyticsRouter["Analytics & Maps API\n(/api/analytics)"]
        AdminRouter["Admin Operations API\n(/api/admin)"]
    end

    subgraph ML_Engines ["Machine Learning Subsystems"]
        VisionAI["PyTorch Vision Classifier\n(CivicNet 4-Conv / MobileNetV3)\n- 6-Class Triage (Acc: 95.56%)\n- Latent Feature Extractor (128-dim)"]
        SeverityRules["Evidence-Weighted Severity Engine\n- Obstruction Multiplier\n- Baseline Risk Weighting"]
        DuplicateDetector["Multi-Signal Duplicate Engine\n- Haversine Spatial Proximity\n- Lexical & Semantic Text Overlap\n- Latent Visual Cosine Similarity\n- Category Compatibility & Temporal Delta"]
    end

    subgraph RAG_System ["RAG Knowledge Engine"]
        DocIngestion["Document Parser\n(PyPDF / Markdown Chunking)\n- Preserves Title, Org, Section, SLAs"]
        VectorStore["FAISS Vector Store\n(IndexFlatIP 384-dim)"]
        LocalLLM["Local LLM Interface\n(Ollama llama3.2 / Grounded Fallback)\n- Source Citations & Prompt Defense"]
    end

    subgraph Data_Storage ["Data Persistence Layer"]
        DB[(Relational DB\nSQLite / PostgreSQL)]
        FileStore["Static Storage\n(/uploads - Sanitized JPEG/PNG/WebP)"]
    end

    UI_Citizen --> API_Gateway
    UI_Admin --> API_Gateway

    IncidentRouter --> VisionAI
    IncidentRouter --> SeverityRules
    IncidentRouter --> DuplicateDetector
    IncidentRouter --> DB
    IncidentRouter --> FileStore

    AssistantRouter --> RAG_System
    RAG_System --> DocIngestion
    DocIngestion --> VectorStore
    VectorStore --> LocalLLM

    AnalyticsRouter --> DB
    AdminRouter --> DB
    AdminRouter --> VectorStore
```

---

## 2. Multi-Signal Duplicate Detection Architecture

The duplicate detection score $S \in [0, 1]$ is computed as:

$$S = w_{geo} \cdot S_{geo} + w_{text} \cdot S_{text} + w_{cat} \cdot S_{cat} + w_{time} \cdot S_{time} + w_{img} \cdot S_{img}$$

Where weights are empirically configured:
* $w_{geo} = 0.35$ (Haversine distance thresholded at $25\text{m}$, $75\text{m}$, $200\text{m}$)
* $w_{text} = 0.25$ (Jaccard token similarity + character $3$-gram cosine overlap)
* $w_{cat} = 0.20$ (Exact category match $= 1.0$, compatible categories $= 0.6$)
* $w_{time} = 0.10$ (Exponential decay over hours elapsed)
* $w_{img} = 0.10$ (Cosine similarity of normalized 128-dimensional latent visual embeddings)

---

## 3. Database Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ INCIDENTS : reports
    USERS ||--o{ ASSISTANT_CONVERSATIONS : owns
    INCIDENTS ||--o{ INCIDENT_IMAGES : contains
    INCIDENTS ||--o{ STATUS_HISTORY : logs
    INCIDENTS ||--o{ DUPLICATE_CANDIDATES : matches
    KNOWLEDGE_DOCUMENTS ||--o{ DOCUMENT_CHUNKS : splits
    ASSISTANT_CONVERSATIONS ||--o{ ASSISTANT_MESSAGES : contains

    USERS {
        int id PK
        string email
        string hashed_password
        string full_name
        string role
        boolean privacy_blur_location
    }

    INCIDENTS {
        int id PK
        string title
        string description
        string category
        string severity
        string status
        float latitude
        float longitude
        string address
        string obstruction_level
        float affected_area_sqm
        int user_id FK
    }

    DUPLICATE_CANDIDATES {
        int id PK
        int incident_id FK
        int candidate_incident_id FK
        float composite_score
        string status
    }
```
