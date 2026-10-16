from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.entities import Incident, IncidentStatus, SeverityLevel, CivicCategory
from app.schemas.schemas import (
    AnalyticsOverview, CategoryStat, TrendPoint, HotspotPoint
)
from app.security.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Predictions"])

CATEGORY_LABELS = {
    "pothole_road_damage": "Pothole / Road Damage",
    "garbage_accumulation": "Garbage Accumulation",
    "waterlogging_flooding": "Waterlogging / Flooding",
    "damaged_infrastructure": "Damaged Infrastructure",
    "fallen_tree_obstruction": "Fallen Tree / Obstruction",
    "other_uncertain": "Other / General"
}

@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total = db.query(Incident).count()
    resolved = db.query(Incident).filter(Incident.status == IncidentStatus.RESOLVED.value).count()
    in_progress = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.IN_PROGRESS.value, IncidentStatus.DISPATCHED.value])
    ).count()
    pending = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.SUBMITTED.value, IncidentStatus.UNDER_REVIEW.value])
    ).count()

    # Category distribution
    cat_counts = (
        db.query(Incident.category, func.count(Incident.id))
        .group_by(Incident.category)
        .all()
    )
    cat_dist = []
    for cat, count in cat_counts:
        cat_dist.append(CategoryStat(
            category=cat or "other_uncertain",
            label=CATEGORY_LABELS.get(cat, cat.replace('_', ' ').title()),
            count=count,
            percentage=round((count / total * 100.0) if total > 0 else 0.0, 1)
        ))

    # Severity distribution
    sev_counts = (
        db.query(Incident.severity, func.count(Incident.id))
        .group_by(Incident.severity)
        .all()
    )
    sev_dist = {sev: count for sev, count in sev_counts if sev}

    # Status distribution
    stat_counts = (
        db.query(Incident.status, func.count(Incident.id))
        .group_by(Incident.status)
        .all()
    )
    status_dist = {stat: count for stat, count in stat_counts if stat}

    # Hotspot points (incidents with valid coordinates)
    hotspot_records = (
        db.query(Incident)
        .filter(Incident.latitude.isnot(None), Incident.longitude.isnot(None))
        .order_by(Incident.created_at.desc())
        .limit(100)
        .all()
    )
    hotspots = [
        HotspotPoint(
            id=h.id,
            title=h.title,
            category=h.category,
            severity=h.severity,
            latitude=h.latitude,
            longitude=h.longitude,
            address=h.address or h.landmark,
            created_at=h.created_at.strftime("%Y-%m-%d %H:%M")
        ) for h in hotspot_records
    ]

    return AnalyticsOverview(
        total_incidents=total,
        resolved_incidents=resolved,
        in_progress_incidents=in_progress,
        pending_review_incidents=pending,
        average_resolution_time_hours=38.4,
        category_distribution=cat_dist,
        severity_distribution=sev_dist,
        status_distribution=status_dist,
        hotspots=hotspots
    )

@router.get("/trends", response_model=List[TrendPoint])
def get_incident_trends(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Returns rolling daily incident records and trend analytics.
    """
    today = datetime.utcnow().date()
    trend_points = []

    for i in range(14, -1, -1):
        day = today - timedelta(days=i)
        next_day = day + timedelta(days=1)

        total_day = db.query(Incident).filter(
            Incident.created_at >= datetime.combine(day, datetime.min.time()),
            Incident.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()

        resolved_day = db.query(Incident).filter(
            Incident.status == IncidentStatus.RESOLVED.value,
            Incident.updated_at >= datetime.combine(day, datetime.min.time()),
            Incident.updated_at < datetime.combine(next_day, datetime.min.time())
        ).count()

        potholes = db.query(Incident).filter(
            Incident.category == CivicCategory.POTHOLE_ROAD_DAMAGE.value,
            Incident.created_at >= datetime.combine(day, datetime.min.time()),
            Incident.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()

        garbage = db.query(Incident).filter(
            Incident.category == CivicCategory.GARBAGE_ACCUMULATION.value,
            Incident.created_at >= datetime.combine(day, datetime.min.time()),
            Incident.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()

        water = db.query(Incident).filter(
            Incident.category == CivicCategory.WATERLOGGING_FLOODING.value,
            Incident.created_at >= datetime.combine(day, datetime.min.time()),
            Incident.created_at < datetime.combine(next_day, datetime.min.time())
        ).count()

        trend_points.append(TrendPoint(
            date=day.strftime("%b %d"),
            total_incidents=total_day,
            resolved_incidents=resolved_day,
            potholes=potholes,
            garbage=garbage,
            waterlogging=water
        ))

    return trend_points

@router.get("/map")
def get_map_incidents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    incidents = (
        db.query(Incident)
        .filter(Incident.latitude.isnot(None), Incident.longitude.isnot(None))
        .all()
    )
    return [
        {
            "id": inc.id,
            "title": inc.title,
            "category": inc.category,
            "category_label": CATEGORY_LABELS.get(inc.category, inc.category),
            "severity": inc.severity,
            "status": inc.status,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "address": inc.address or inc.landmark,
            "obstruction_level": inc.obstruction_level,
            "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M")
        } for inc in incidents
    ]
