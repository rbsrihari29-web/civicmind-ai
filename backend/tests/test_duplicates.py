from datetime import datetime, timedelta
from app.ml.duplicates import duplicate_detector, haversine_distance_meters

def test_haversine_distance():
    # T. Nagar to Panagal park (~100m)
    d = haversine_distance_meters(13.0418, 80.2337, 13.0425, 80.2339)
    assert 50 < d < 150

def test_high_duplicate_match():
    now = datetime.utcnow()
    inc1 = {
        "title": "Severe pothole on Usman Road descent",
        "description": "Large asphalt crater causing two wheelers to skid",
        "category": "pothole_road_damage",
        "latitude": 13.0418,
        "longitude": 80.2337,
        "created_at": now
    }
    inc2 = {
        "title": "Usman Road flyover pothole crater",
        "description": "Deep asphalt hole two wheelers slipping",
        "category": "pothole_road_damage",
        "latitude": 13.0419,
        "longitude": 80.2338,
        "created_at": now - timedelta(hours=2)
    }

    res = duplicate_detector.evaluate_pair(inc1, inc2)
    assert res["composite_score"] >= 0.70
    assert res["confidence_level"] == "High"
    assert "geographic_proximity_score" in res["signal_breakdown"]

def test_distinct_incidents():
    now = datetime.utcnow()
    inc1 = {
        "title": "Garbage dump near Mylapore tank",
        "description": "Overflowing waste bins",
        "category": "garbage_accumulation",
        "latitude": 13.0334,
        "longitude": 80.2673,
        "created_at": now
    }
    inc2 = {
        "title": "Fallen tree blocking Anna Nagar 2nd Avenue",
        "description": "Uprooted gulmohar tree",
        "category": "fallen_tree_obstruction",
        "latitude": 13.0850,
        "longitude": 80.2101,
        "created_at": now - timedelta(days=10)
    }

    res = duplicate_detector.evaluate_pair(inc1, inc2)
    assert res["composite_score"] < 0.35
    assert res["confidence_level"] == "Low"
