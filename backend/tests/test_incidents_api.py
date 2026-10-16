from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "operational"

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"

def test_citizen_login_and_fetch_incidents():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "citizen@civicmind.org", "password": "Citizen@Pass123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

    # Fetch incidents
    headers = {"Authorization": f"Bearer {token}"}
    inc_res = client.get("/api/incidents", headers=headers)
    assert inc_res.status_code == 200
    incidents = inc_res.json()
    assert len(incidents) > 0

def test_complaint_draft_generation():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "citizen@civicmind.org", "password": "Citizen@Pass123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    draft_res = client.post(
        "/api/assistant/complaint-draft",
        headers=headers,
        json={"incident_id": 1}
    )
    assert draft_res.status_code == 200
    data = draft_res.json()
    assert "subject" in data
    assert "FORMAL" in data["subject"]
    assert data["statutory_sla_days"] >= 1
    assert len(data["evidence_checklist"]) > 0

def test_analytics_overview():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@civicmind.gov.in", "password": "Admin@CivicMind2026"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/analytics/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_incidents"] > 0
    assert len(data["category_distribution"]) > 0
