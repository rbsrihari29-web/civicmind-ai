import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.entities import (
    User, UserRole, Incident, IncidentImage, IncidentStatus,
    SeverityLevel, DuplicateCandidate, DuplicateStatus, IncidentStatusHistory
)
from app.schemas.schemas import (
    IncidentResponse, IncidentUpdate, DuplicateMatchCandidate, DuplicateSignalBreakdown,
    DuplicateReviewAction, ImageAnalysisResponse, SeverityAssessmentResponse
)
from app.security.auth import get_current_user, require_admin
from app.ml.classifier import image_classifier
from app.ml.severity import severity_assessor
from app.ml.duplicates import duplicate_detector

router = APIRouter(prefix="/incidents", tags=["Incidents"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    title: str = Form(...),
    description: str = Form(...),
    user_category: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    obstruction_level: Optional[str] = Form("none"),
    affected_area_sqm: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    ml_category = None
    ml_confidence = None
    review_required = False
    image_bytes = None
    image_embedding = None
    class_probs = None
    image_record = None

    if image is not None:
        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported image type '{image.content_type}'. Supported: JPEG, PNG, WebP."
            )

        image_bytes = await image.read()
        if len(image_bytes) > settings.MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image exceeds maximum size of {settings.MAX_IMAGE_SIZE_MB}MB."
            )

        # Run real ML model inference
        pred_res = image_classifier.predict(image_bytes)
        ml_category = pred_res.get("predicted_category")
        ml_confidence = pred_res.get("confidence")
        review_required = pred_res.get("review_required", False)
        class_probs = {p["category"]: p["probability"] for p in pred_res.get("class_probabilities", [])}

        # Extract latent visual feature vector
        image_embedding = image_classifier.extract_image_embedding(image_bytes)

        # Save image file to disk with unique sanitized name
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(image_bytes)

    # Determine final effective category: ML prediction or user category fallback
    final_category = ml_category or user_category or "other_uncertain"

    # Compute rule-based severity assessment
    sev_res = severity_assessor.assess(
        category=final_category,
        obstruction_level=obstruction_level,
        affected_area_sqm=affected_area_sqm
    )
    severity_level = sev_res["level"]
    severity_exp = f"Score: {sev_res['score']}/100. Factors: {', '.join(sev_res['factors'])}"

    # Create incident record
    incident = Incident(
        title=title,
        description=description,
        category=final_category,
        user_category=user_category,
        ml_category=ml_category,
        ml_confidence=ml_confidence,
        severity=severity_level,
        severity_explanation=severity_exp,
        status=IncidentStatus.SUBMITTED.value,
        latitude=latitude,
        longitude=longitude,
        address=address,
        landmark=landmark,
        obstruction_level=obstruction_level,
        affected_area_sqm=affected_area_sqm,
        user_id=current_user.id,
        review_required=review_required
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Create image record if uploaded
    if image is not None and image_bytes is not None:
        image_record = IncidentImage(
            incident_id=incident.id,
            file_path=f"/uploads/{filename}",
            original_filename=image.filename or "uploaded_image.jpg",
            file_size_bytes=len(image_bytes),
            mime_type=image.content_type,
            ml_predicted_class=ml_category,
            ml_confidence=ml_confidence,
            class_probabilities=class_probs,
            image_embedding=image_embedding
        )
        db.add(image_record)

    # Log initial status history
    history = IncidentStatusHistory(
        incident_id=incident.id,
        previous_status=None,
        new_status=IncidentStatus.SUBMITTED.value,
        changed_by_id=current_user.id,
        notes="Grievance filed by citizen via web application"
    )
    db.add(history)
    db.commit()

    # Automatic Duplicate Detection against existing incidents
    recent_incidents = (
        db.query(Incident)
        .filter(Incident.id != incident.id)
        .order_by(Incident.created_at.desc())
        .limit(50)
        .all()
    )

    inc_dict = {
        "title": incident.title,
        "description": incident.description,
        "category": incident.category,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "created_at": incident.created_at,
        "image_embedding": image_embedding
    }

    for other in recent_incidents:
        other_img = db.query(IncidentImage).filter(IncidentImage.incident_id == other.id).first()
        other_dict = {
            "title": other.title,
            "description": other.description,
            "category": other.category,
            "latitude": other.latitude,
            "longitude": other.longitude,
            "created_at": other.created_at,
            "image_embedding": other_img.image_embedding if other_img else None
        }

        dup_eval = duplicate_detector.evaluate_pair(inc_dict, other_dict)
        if dup_eval["composite_score"] >= 0.45:
            candidate = DuplicateCandidate(
                incident_id=incident.id,
                candidate_incident_id=other.id,
                composite_score=dup_eval["composite_score"],
                text_score=dup_eval["signal_breakdown"]["text_similarity"],
                geo_score=dup_eval["signal_breakdown"]["geographic_proximity_score"],
                cat_score=dup_eval["signal_breakdown"]["category_match_score"],
                time_score=dup_eval["signal_breakdown"]["temporal_proximity_score"],
                img_score=dup_eval["signal_breakdown"]["image_similarity_score"],
                status=DuplicateStatus.PENDING.value
            )
            db.add(candidate)

    db.commit()
    db.refresh(incident)
    return incident

@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    category: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    only_mine: Optional[bool] = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)

    if only_mine or current_user.role == UserRole.CITIZEN.value and only_mine:
        query = query.filter(Incident.user_id == current_user.id)

    if category:
        query = query.filter(Incident.category == category)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.order_by(Incident.created_at.desc()).all()

    # Privacy protection: if citizen enabled location blurring, slightly perturb/blur coordinates
    for inc in incidents:
        if inc.reporter and inc.reporter.privacy_blur_location:
            if inc.latitude is not None and inc.longitude is not None:
                inc.latitude = round(inc.latitude, 2)
                inc.longitude = round(inc.longitude, 2)

    return incidents

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    update_data: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    # Only admin can update status and override category or add admin notes
    if (update_data.status or update_data.category or update_data.admin_notes is not None) and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update grievance status or override classifications."
        )

    # Track status change history
    if update_data.status and update_data.status != incident.status:
        history = IncidentStatusHistory(
            incident_id=incident.id,
            previous_status=incident.status,
            new_status=update_data.status,
            changed_by_id=current_user.id,
            notes=update_data.admin_notes or "Status transitioned by municipal administrator"
        )
        db.add(history)
        incident.status = update_data.status

    if update_data.category:
        incident.category = update_data.category
    if update_data.severity:
        incident.severity = update_data.severity
    if update_data.admin_notes is not None:
        incident.admin_notes = update_data.admin_notes
    if update_data.review_required is not None:
        incident.review_required = update_data.review_required

    db.commit()
    db.refresh(incident)
    return incident

@router.get("/{incident_id}/duplicates", response_model=List[DuplicateMatchCandidate])
def get_incident_duplicates(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    candidates = (
        db.query(DuplicateCandidate)
        .filter(DuplicateCandidate.incident_id == incident_id)
        .order_by(DuplicateCandidate.composite_score.desc())
        .all()
    )

    results = []
    for c in candidates:
        cand_inc = c.candidate_incident
        if not cand_inc:
            continue
        eval_dict = duplicate_detector.evaluate_pair(
            {
                "title": incident.title,
                "description": incident.description,
                "category": incident.category,
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "created_at": incident.created_at
            },
            {
                "title": cand_inc.title,
                "description": cand_inc.description,
                "category": cand_inc.category,
                "latitude": cand_inc.latitude,
                "longitude": cand_inc.longitude,
                "created_at": cand_inc.created_at
            }
        )

        results.append(
            DuplicateMatchCandidate(
                candidate_id=cand_inc.id,
                candidate_title=cand_inc.title,
                candidate_category=cand_inc.category,
                candidate_created_at=cand_inc.created_at,
                candidate_address=cand_inc.address or cand_inc.landmark,
                candidate_distance_meters=eval_dict["distance_meters"],
                composite_score=c.composite_score,
                confidence_level=eval_dict["confidence_level"],
                signal_breakdown=DuplicateSignalBreakdown(
                    text_similarity=c.text_score,
                    geographic_proximity_score=c.geo_score,
                    category_match_score=c.cat_score,
                    temporal_proximity_score=c.time_score,
                    image_similarity_score=c.img_score
                ),
                explanation=eval_dict["explanation"]
            )
        )
    return results

@router.post("/{incident_id}/duplicates/review")
def review_duplicate(
    incident_id: int,
    review_in: DuplicateReviewAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    if review_in.action == "confirm_duplicate":
        if not review_in.parent_incident_id:
            raise HTTPException(status_code=400, detail="parent_incident_id is required to merge as duplicate.")
        incident.is_duplicate_of = review_in.parent_incident_id
        incident.status = IncidentStatus.REJECTED.value
        incident.admin_notes = f"Merged as duplicate of Incident #{review_in.parent_incident_id}. Notes: {review_in.notes or 'None'}"
        
        # Update duplicate candidates
        db.query(DuplicateCandidate).filter(
            DuplicateCandidate.incident_id == incident_id,
            DuplicateCandidate.candidate_incident_id == review_in.parent_incident_id
        ).update({
            "status": DuplicateStatus.CONFIRMED_DUPLICATE.value,
            "reviewed_by_id": current_user.id,
            "review_notes": review_in.notes
        })
    elif review_in.action == "dismiss":
        db.query(DuplicateCandidate).filter(
            DuplicateCandidate.incident_id == incident_id
        ).update({
            "status": DuplicateStatus.DISMISSED.value,
            "reviewed_by_id": current_user.id,
            "review_notes": review_in.notes
        })
    else:
        raise HTTPException(status_code=400, detail="Unknown review action. Use 'confirm_duplicate' or 'dismiss'.")

    db.commit()
    return {"message": f"Duplicate review recorded successfully: {review_in.action}"}

@router.post("/preview-analysis", response_model=ImageAnalysisResponse)
async def preview_image_analysis(
    image: UploadFile = File(...)
):
    """Allows citizen to preview ML classification before final grievance submission."""
    if image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{image.content_type}'."
        )
    image_bytes = await image.read()
    res = image_classifier.predict(image_bytes)
    return res
