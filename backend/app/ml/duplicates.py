import math
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def tokenize(text: str) -> set:
    words = re.findall(r'\b[a-z0-9]{3,}\b', text.lower())
    return set(words)

def compute_text_similarity(text1: str, text2: str) -> float:
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    jaccard = intersection / union if union > 0 else 0.0

    # Also compute 3-gram character similarity
    def get_ngrams(s: str, n: int = 3):
        clean = re.sub(r'\s+', ' ', s.lower().strip())
        return set(clean[i:i+n] for i in range(len(clean) - n + 1))
    
    ng1 = get_ngrams(text1)
    ng2 = get_ngrams(text2)
    ngram_sim = 0.0
    if ng1 and ng2:
        ngram_sim = len(ng1.intersection(ng2)) / len(ng1.union(ng2))

    return max(jaccard, ngram_sim)

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm1 * norm2)))

class DuplicateIncidentDetector:
    """
    Multi-signal weighted duplicate detection engine combining:
    1. Geographic Haversine proximity
    2. Lexical and Semantic text similarity
    3. Category compatibility
    4. Temporal proximity
    5. Latent image feature embedding similarity
    """

    WEIGHTS = {
        "geo": 0.35,
        "text": 0.25,
        "cat": 0.20,
        "time": 0.10,
        "img": 0.10
    }

    COMPATIBLE_CATEGORIES = {
        "pothole_road_damage": {"damaged_infrastructure"},
        "damaged_infrastructure": {"pothole_road_damage"},
        "waterlogging_flooding": {"pothole_road_damage"}
    }

    def evaluate_pair(
        self,
        incident_a: Dict[str, Any],
        incident_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Geographic proximity
        dist_m = None
        if (incident_a.get("latitude") is not None and incident_a.get("longitude") is not None and
            incident_b.get("latitude") is not None and incident_b.get("longitude") is not None):
            dist_m = haversine_distance_meters(
                incident_a["latitude"], incident_a["longitude"],
                incident_b["latitude"], incident_b["longitude"]
            )
            if dist_m <= 25.0:
                geo_score = 1.0
            elif dist_m <= 75.0:
                geo_score = 0.85
            elif dist_m <= 200.0:
                geo_score = 0.60
            elif dist_m <= 500.0:
                geo_score = 0.30
            else:
                geo_score = 0.0
        else:
            geo_score = 0.40  # Neutral baseline if coordinates omitted

        # 2. Text similarity
        text_a = f"{incident_a.get('title', '')} {incident_a.get('description', '')}"
        text_b = f"{incident_b.get('title', '')} {incident_b.get('description', '')}"
        text_score = compute_text_similarity(text_a, text_b)

        # 3. Category match
        cat_a = incident_a.get("category", "")
        cat_b = incident_b.get("category", "")
        if cat_a == cat_b and cat_a != "other_uncertain":
            cat_score = 1.0
        elif cat_b in self.COMPATIBLE_CATEGORIES.get(cat_a, set()):
            cat_score = 0.60
        else:
            cat_score = 0.10

        # 4. Temporal proximity
        time_a = incident_a.get("created_at")
        time_b = incident_b.get("created_at")
        time_score = 0.5
        if isinstance(time_a, datetime) and isinstance(time_b, datetime):
            hours_diff = abs((time_a - time_b).total_seconds()) / 3600.0
            if hours_diff <= 6.0:
                time_score = 1.0
            elif hours_diff <= 24.0:
                time_score = 0.85
            elif hours_diff <= 72.0:
                time_score = 0.60
            elif hours_diff <= 168.0:
                time_score = 0.35
            else:
                time_score = 0.10

        # 5. Image embedding similarity
        img_a = incident_a.get("image_embedding")
        img_b = incident_b.get("image_embedding")
        if img_a and img_b:
            img_score = compute_cosine_similarity(img_a, img_b)
        else:
            img_score = (text_score + geo_score) / 2.0

        # Weighted composite score
        w = self.WEIGHTS
        composite = (
            w["geo"] * geo_score +
            w["text"] * text_score +
            w["cat"] * cat_score +
            w["time"] * time_score +
            w["img"] * img_score
        )

        composite = round(min(max(composite, 0.0), 1.0), 4)

        if composite >= 0.70:
            confidence = "High"
            explanation = "High likelihood duplicate: Close geographic location, matching defect category, and similar report description."
        elif composite >= 0.48:
            confidence = "Medium"
            explanation = "Potential duplicate: Moderate overlap in location or symptoms. Administrative review recommended."
        else:
            confidence = "Low"
            explanation = "Low similarity: Disparate coordinates, timing, or reported civic issue."

        return {
            "composite_score": composite,
            "confidence_level": confidence,
            "distance_meters": round(dist_m, 1) if dist_m is not None else None,
            "signal_breakdown": {
                "geographic_proximity_score": round(geo_score, 3),
                "text_similarity": round(text_score, 3),
                "category_match_score": round(cat_score, 3),
                "temporal_proximity_score": round(time_score, 3),
                "image_similarity_score": round(img_score, 3)
            },
            "explanation": explanation
        }

duplicate_detector = DuplicateIncidentDetector()
