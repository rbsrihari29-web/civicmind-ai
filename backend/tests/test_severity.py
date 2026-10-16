from app.ml.severity import severity_assessor

def test_high_severity_flood_road_closed():
    res = severity_assessor.assess(
        category="waterlogging_flooding",
        obstruction_level="road_closed",
        affected_area_sqm=75.0,
        is_arterial_road=True
    )
    assert res["level"] == "high"
    assert res["score"] >= 60.0
    assert res["is_rule_based"] is True
    assert len(res["factors"]) >= 3

def test_low_severity_minor_garbage():
    res = severity_assessor.assess(
        category="garbage_accumulation",
        obstruction_level="none",
        affected_area_sqm=2.0
    )
    assert res["level"] == "low"
    assert res["score"] < 30.0
    assert res["is_rule_based"] is True
