import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import User, Incident, AssistantConversation, AssistantMessage
from app.schemas.schemas import (
    ChatRequest, ChatResponse, CitationSource,
    ComplaintDraftRequest, ComplaintDraftResponse
)
from app.security.auth import get_current_user
from app.rag.engine import rag_engine

router = APIRouter(prefix="/assistant", tags=["Civic AI Assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch or create conversation
    conv = None
    if chat_in.conversation_id:
        conv = db.query(AssistantConversation).filter(
            AssistantConversation.id == chat_in.conversation_id,
            AssistantConversation.user_id == current_user.id
        ).first()

    if not conv:
        conv = AssistantConversation(
            user_id=current_user.id,
            incident_id=chat_in.incident_id,
            title=chat_in.message[:45] + ("..." if len(chat_in.message) > 45 else "")
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = AssistantMessage(
        conversation_id=conv.id,
        sender="user",
        content=chat_in.message,
        is_grounded=True
    )
    db.add(user_msg)

    # Fetch incident context if requested
    incident_context = None
    inc_id = chat_in.incident_id or conv.incident_id
    if inc_id:
        inc = db.query(Incident).filter(Incident.id == inc_id).first()
        if inc:
            incident_context = {
                "id": inc.id,
                "category": inc.category,
                "severity": inc.severity,
                "address": inc.address,
                "landmark": inc.landmark,
                "obstruction_level": inc.obstruction_level,
                "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M")
            }

    # Query RAG Engine with Grounding
    rag_result = rag_engine.generate_grounded_answer(chat_in.message, incident_context)

    # Save assistant message
    asst_msg = AssistantMessage(
        conversation_id=conv.id,
        sender="assistant",
        content=rag_result["answer"],
        citations=rag_result["citations"],
        is_grounded=rag_result["is_grounded"],
        confidence_notes=rag_result["grounding_confidence"]
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    citation_models = [
        CitationSource(
            document_title=c["document_title"],
            organization=c["organization"],
            section=c.get("section"),
            source_url=c.get("source_url"),
            excerpt=c["excerpt"],
            relevance_score=c["relevance_score"]
        ) for c in rag_result["citations"]
    ]

    return ChatResponse(
        conversation_id=conv.id,
        message_id=asst_msg.id,
        response=rag_result["answer"],
        citations=citation_models,
        is_grounded=rag_result["is_grounded"],
        grounding_confidence=rag_result["grounding_confidence"],
        suggested_follow_ups=rag_result["suggested_follow_ups"]
    )

@router.post("/complaint-draft", response_model=ComplaintDraftResponse)
def generate_complaint_draft(
    draft_in: ComplaintDraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == draft_in.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found.")

    cat_title = incident.category.replace("_", " ").title()
    location_str = incident.address or incident.landmark or f"Coordinates ({incident.latitude}, {incident.longitude})"

    # Determine authority & statutory SLA
    dept_map = {
        "pothole_road_damage": ("Bus Route Roads & Works Department", 48, "GCC Citizen Charter Sec 2.1 (Pothole Rectification SLA)"),
        "garbage_accumulation": ("Solid Waste Management Department", 24, "Tamil Nadu SWM Bylaws 2020 & GCC Citizen Charter Sec 2.2"),
        "waterlogging_flooding": ("Storm Water Drain (SWD) Department", 24, "GCC Monsoon SWD SOP 2023 Sec 2 (Inundation Abatement)"),
        "damaged_infrastructure": ("Electrical & Civil Infrastructure Wing", 48, "Public Infrastructure Safety Protocol 2022 Sec 2"),
        "fallen_tree_obstruction": ("Parks & Disaster Management Cell", 6, "GCC Citizen Charter Sec 2.5 (Obstruction Clearing)"),
        "other_uncertain": ("Ward Public Grievance Cell", 72, "General Grievance Redressal Regulation")
    }

    dept_name, sla_hours, statutory_ref = dept_map.get(
        incident.category, ("General Municipal Grievances", 72, "GCC Grievance Protocol")
    )
    sla_days = max(1, round(sla_hours / 24))

    subject = f"FORMAL CITIZEN COMPLAINT: URGENT RECTIFICATION OF {cat_title.upper()} AT {location_str.upper()} [INCIDENT REF #{incident.id}]"
    salutation = f"To:\nThe Executive Engineer / Zonal Officer\n{dept_name}\nGreater Chennai Corporation\nChennai, Tamil Nadu"

    body = (
        f"Sir / Madam,\n\n"
        f"I am writing as a conscientious resident to formally record an active civic grievance regarding a severe "
        f"instance of {cat_title} located at {location_str}.\n\n"
        f"INCIDENT PARTICULARS:\n"
        f"• Complaint Reference ID: #{incident.id}\n"
        f"• Defect Classification: {cat_title}\n"
        f"• Physical Obstruction Level: {incident.obstruction_level.replace('_', ' ').title()}\n"
        f"• Reported Date & Time: {incident.created_at.strftime('%d-%b-%Y at %I:%M %p')}\n"
        f"• Verified Severity Rating: {incident.severity.upper()}\n\n"
        f"DESCRIPTION OF GRIEVANCE:\n"
        f"{incident.description}\n\n"
        f"STATUTORY RIGHT & CITIZEN CHARTER SLA:\n"
        f"Under {statutory_ref}, municipal engineering units are legally mandated to remediate and restore this "
        f"civic defect within a statutory timeline of {sla_hours} hours ({sla_days} calendar days) of formal registration. "
        f"Prolonged inaction creates severe traffic hazards, compromises pedestrian safety, and constitutes non-compliance "
        f"with municipal standards.\n\n"
        f"I request that an inspection team under the Assistant Engineer (Works) be dispatched immediately to cordone, "
        f"remedy, and upload photographic evidence of rectification.\n\n"
        f"Yours sincerely,\n"
        f"{current_user.full_name}\n"
        f"Email: {current_user.email}\n"
        f"Date: {datetime.date.today().strftime('%d-%B-%Y')}"
    )

    checklist = [
        "Include clear wide-angle and close-up photographs showing the surrounding streetscape.",
        f"Reference Complaint ID #{incident.id} on the GCC 1913 telephone helpline.",
        "Submit a signed copy at the Wednesday Zonal Public Grievance Day if unresolved after SLA.",
        "Retain this draft as an evidence audit record for statutory escalation to the Regional Deputy Commissioner."
    ]

    disclaimer = (
        "Notice: This document is an AI-assisted formal grievance draft grounded in verified municipal charters. "
        "It does not constitute automated submission to municipal authorities until transmitted through official channels."
    )

    return ComplaintDraftResponse(
        incident_id=incident.id,
        subject=subject,
        salutation=salutation,
        body=body,
        recipient_department=dept_name,
        statutory_sla_days=sla_days,
        statutory_reference=statutory_ref,
        evidence_checklist=checklist,
        disclaimer=disclaimer
    )
