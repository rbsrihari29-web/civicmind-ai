# CivicMind AI: Demonstration & Testing Walkthrough

Follow this step-by-step guide to demonstrate the complete, functional, integrated features of CivicMind AI.

---

## 1. Quick Launch Commands

### Terminal 1: FastAPI Backend
```powershell
cd backend
$env:PYTHONPATH="C:\Users\Srihari R B\.gemini\antigravity\scratch\civicmind-ai\backend"
py -3.14 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API Documentation will be available at: http://localhost:8000/docs*

### Terminal 2: Vite React Frontend
```powershell
cd frontend
npm run dev
```
*Web Application will be available at: http://localhost:5173*

---

## 2. Test Accounts (Pre-Seeded)

| Role | Email | Password | Intended Use |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicmind.org` | `Citizen@Pass123` | Filing reports, tracking status, complaint drafting |
| **Administrator** | `admin@civicmind.gov.in` | `Admin@CivicMind2026` | Triage queue, classification override, duplicate merges |

---

## 3. End-to-End Walkthrough Scenarios

### Scenario A: Citizen Grievance Submission with Live AI Preview
1. Open `http://localhost:5173` and click **"Citizen Demo"** on the landing page (or sign in via `/login`).
2. Navigate to **"Report Issue"** (`/report`).
3. Select an image (or choose a sample from `ml-training/data/test/pothole_road_damage/`).
4. **Notice:** The live AI preview immediately runs PyTorch vision inference and displays the detected category (`Pothole or Road Damage`), confidence score (e.g. `96.4%`), and probability breakdown bars.
5. In the description, type: *"Large asphalt pothole right before the flyover curve, causing two-wheelers to skid."*
6. Set Obstruction Level to **"Carriageway Lane Blocked"** and affected area to **`12 m²`**.
7. Click on the Leaflet map in T. Nagar or Mylapore to place the GPS pin marker.
8. Click **"Submit Grievance to Municipal Triage"**.
9. The application redirects to the **Incident Details Page** (`/incident/:id`).

---

### Scenario B: Evidence-Weighted Severity & Duplicate Alert
1. On the Incident Details page:
   * Review the **Statutory Redressal Progress Tracker** (Step 1: Submitted).
   * Review the **Evidence-Weighted Severity Card**: Shows `High Severity` based on physical obstruction and category baseline risk.
   * If a nearby incident exists, review the **Multi-Signal Duplicate Alert**: Shows composite match percentage and breakdowns (spatial distance, text overlap, category match).

---

### Scenario C: Grounded Complaint Letter Drafting
1. On the Incident Details page, click **"Generate Complaint Letter"**.
2. Notice the generated formal petition:
   * Formatted to the *Executive Engineer (Works), Greater Chennai Corporation*.
   * Cites **GCC Citizen Charter Section 2.1 (Pothole Rectification SLA: 48 Hours)**.
   * Incorporates the citizen's name, complaint ID, coordinates, and physical dimensions.
   * Provides an actionable evidence checklist.
3. Click **"Copy Draft"** to copy the formatted text to your clipboard.

---

### Scenario D: Conversational Consultation with Civic AI Assistant
1. Navigate to **"Civic AI"** (`/assistant`).
2. Click the suggested prompt: *"What is the statutory repair SLA for potholes in Chennai?"* or type your own question.
3. Notice:
   * The assistant returns the legally binding timeline: **48 hours for Bus Route Roads** and **72 hours for interior roads**.
   * The response includes clickable citation pills: `Doc: GREATER CHENNAI CORPORATION (GCC)...`.
   * Clicking a citation displays the verified statutory passage and official government URL in the right-hand evidence drawer.

---

### Scenario E: Administrator Triage & Classification Override
1. Log out or open an incognito window, then sign in as **Administrator** (`admin@civicmind.gov.in`).
2. Navigate to the **Admin Hub** (`/admin`):
   * View the 14-day rolling grievance trend line chart.
   * Inspect the category distribution horizontal bar chart.
   * Click **"Export CSV"** to download an authorized incident record.
3. Go to the **Triage Queue** (`/admin/review`):
   * Select a ticket from the left list.
   * Compare Citizen Submission vs AI Model Output.
   * Change status to **"Dispatched to Ward Engineer"**.
   * Add administrative notes: *"Dispatched QRT unit with cold-mix patching truck."*
   * Click **"Save Triage Decisions"**.

---

### Scenario F: Multi-Signal Duplicate Review & Merge
1. Navigate to **"Duplicates"** (`/admin/duplicates`).
2. Select an incident with candidate matches.
3. Inspect the explainable signal progress bars:
   * Geographic Haversine Proximity
   * Lexical & Semantic Text Overlap
   * Category Compatibility
   * Temporal Proximity
4. Click **"Confirm Duplicate & Merge Ticket"**.
5. Notice the target ticket is flagged as merged into the parent incident with full audit trails.

---

### Scenario G: ML Evaluation & Knowledge Base Management
1. Go to **"ML Eval"** (`/admin/evaluations`):
   * View the $6 \times 6$ confusion matrix generated on the held-out test split.
   * Review per-class Precision, Recall, and F1-Scores.
   * Verify the **95.56% overall accuracy (+78.89% gain over baseline)**.
2. Go to **"RAG Docs"** (`/admin/knowledge`):
   * Inspect the 5 indexed municipal documents.
   * Click **"Re-index Vector Store"** to re-process all chunks into FAISS.
