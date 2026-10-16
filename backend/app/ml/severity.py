from typing import Dict, Any, List, Optional
from app.models.entities import SeverityLevel, CivicCategory

class CivicSeverityAssessor:
    """
    Transparent, evidence-weighted rule-based severity assessment engine.
    Strictly marked as rule-based to prevent misrepresenting deterministic heuristic
    priorities as machine learning danger predictions.
    """

    BASE_WEIGHTS = {
        CivicCategory.WATERLOGGING_FLOODING.value: 35.0,
        CivicCategory.FALLEN_TREE_OBSTRUCTION.value: 35.0,
        CivicCategory.DAMAGED_INFRASTRUCTURE.value: 30.0,
        CivicCategory.POTHOLE_ROAD_DAMAGE.value: 25.0,
        CivicCategory.GARBAGE_ACCUMULATION.value: 15.0,
        CivicCategory.OTHER_UNCERTAIN.value: 10.0,
    }

    OBSTRUCTION_WEIGHTS = {
        "road_closed": 40.0,
        "lane_blocked": 25.0,
        "partial_footpath": 12.0,
        "none": 0.0
    }

    def assess(
        self,
        category: str,
        obstruction_level: Optional[str] = "none",
        affected_area_sqm: Optional[float] = None,
        is_arterial_road: bool = False
    ) -> Dict[str, Any]:
        factors: List[str] = []
        score = 0.0

        # 1. Base category hazard score
        base_score = self.BASE_WEIGHTS.get(category, 10.0)
        score += base_score
        factors.append(f"Category base hazard risk: +{base_score:.1f} pts ({category.replace('_', ' ').title()})")

        # 2. Obstruction severity
        obs_key = obstruction_level or "none"
        obs_score = self.OBSTRUCTION_WEIGHTS.get(obs_key, 0.0)
        score += obs_score
        if obs_score > 0:
            factors.append(f"Physical obstruction level: +{obs_score:.1f} pts ({obs_key.replace('_', ' ')})")

        # 3. Affected area scale
        if affected_area_sqm is not None and affected_area_sqm > 0:
            if affected_area_sqm >= 50:
                score += 20.0
                factors.append(f"Large surface footprint (>= 50 m²): +20.0 pts")
            elif affected_area_sqm >= 15:
                score += 10.0
                factors.append(f"Moderate surface footprint (15-49 m²): +10.0 pts")
            else:
                score += 5.0
                factors.append(f"Minor surface footprint (< 15 m²): +5.0 pts")

        # 4. Arterial road multiplier
        if is_arterial_road:
            score += 15.0
            factors.append("High-density arterial thoroughfare: +15.0 pts")

        # Clamp score to [0, 100]
        final_score = min(max(score, 0.0), 100.0)

        # Classification threshold
        if final_score >= 60.0:
            level = SeverityLevel.HIGH.value
            explanation = "High priority dispatch required: Severe physical obstruction or hazardous civic emergency."
        elif final_score >= 30.0:
            level = SeverityLevel.MEDIUM.value
            explanation = "Medium priority: Active civic defect requiring scheduled municipal maintenance within 48-72 hours."
        else:
            level = SeverityLevel.LOW.value
            explanation = "Low priority: Localized civic nuisance or early-stage defect with low immediate public hazard."

        return {
            "level": level,
            "score": round(final_score, 1),
            "factors": factors,
            "is_rule_based": True,
            "confidence": 0.85 if obstruction_level and affected_area_sqm is not None else 0.60,
            "explanation": explanation
        }

severity_assessor = CivicSeverityAssessor()
