# CivicMind AI: Operational Limitations & Future Roadmap

To uphold scientific and operational integrity, this document specifies current system boundaries, technical constraints, and planned enhancements.

---

## 1. Local LLM & Hardware Requirements

* **Local Inference via Ollama:**
  * For local LLM inference using models such as `llama3.2:3b` or `mistral:7b`, a system with at least 8 GB to 16 GB of RAM is recommended.
  * When running exclusively on CPU, inference token velocity is typically 5 to 15 tokens/sec.
* **Fail-Safe Fallback:**
  * When Ollama is offline or uninstalled, CivicMind AI transitions gracefully to its embedded deterministic grounded reasoning engine. This ensures zero downtime and 100% testable functionality on any machine without requiring external paid APIs.

---

## 2. Computer Vision & ML Scope

* **Defect Class Boundaries:**
  * The classifier is trained on 6 operational categories: Potholes, Garbage, Waterlogging, Infrastructure, Fallen Trees, and Other/Uncertain.
  * Extreme low-light / night dashcam captures, extreme camera motion blur, or tightly cropped macro shots may produce lower confidence scores.
  * The system addresses this limitation by setting `review_required = True` whenever model confidence falls below the $0.65$ threshold.
* **Supervised Danger Estimation:**
  * The current severity module is an evidence-weighted, rule-based rubric incorporating physical obstruction and category baseline risk. It is transparently labeled as rule-based rather than claiming predictive hazard modeling without longitudinal injury data.

---

## 3. RAG Knowledge Scope

* **Language Scope:**
  * The source documents are in English (the official language of municipal engineering standards like IRC:82 and GCC charters).
  * Future iterations will incorporate bi-lingual embeddings in Tamil (`தமிழ்நாடு தூய்மைப் பணிகள் மற்றும் பேரிடர் மேலாண்மை வழிகாட்டு நெறிமுறைகள்`) using multilingual transformers.
* **Municipal Authority Jurisdictions:**
  * While focused on the 15 zones of the Greater Chennai Corporation (GCC), civic boundary overlays often involve overlapping state authorities (e.g. CMWSSB water lines, TANGEDCO electric cables, and State Highways).

---

## 4. Production API Interfacing

* **Complaint Transmission:**
  * The current complaint generator outputs formal, statutory complaint letters with verified citation references and SLAs.
  * Direct transmission to city ERP servers requires signed municipal API access agreements and authenticated webhook endpoints with the municipal IT department.
