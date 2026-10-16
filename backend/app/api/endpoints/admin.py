import os
import json
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.session import get_db
from app.core.config import settings
from app.models.entities import (
    User, Incident, IncidentImage, KnowledgeDocument,
    DocumentChunk, IncidentStatus
)
from app.schemas.schemas import KnowledgeDocumentResponse
from app.security.auth import require_admin
from app.rag.engine import rag_engine

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.get("/models")
def get_model_info(current_user: User = Depends(require_admin)):
    metadata_path = os.path.abspath(settings.ML_METADATA_PATH)
    if not os.path.exists(metadata_path):
        return {
            "model_trained": False,
            "message": "Model has not yet completed training."
        }
    with open(metadata_path, "r") as f:
        meta = json.load(f)
    return {
        "model_trained": True,
        "metadata": meta
    }

@router.get("/evaluations")
def get_evaluation_results(current_user: User = Depends(require_admin)):
    eval_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "ml-training", "evaluations", "image_model_evaluation.json"
    )
    eval_path = os.path.abspath(eval_path)
    if not os.path.exists(eval_path):
        raise HTTPException(status_code=404, detail="Evaluation results record not found.")
    with open(eval_path, "r") as f:
        eval_data = json.load(f)
    return eval_data

@router.get("/low-confidence-incidents")
def get_low_confidence_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve incidents where ML classification confidence is below threshold or requires review."""
    incidents = (
        db.query(Incident)
        .filter(Incident.review_required == True)
        .order_by(Incident.created_at.desc())
        .all()
    )
    return [
        {
            "id": inc.id,
            "title": inc.title,
            "category": inc.category,
            "user_category": inc.user_category,
            "ml_category": inc.ml_category,
            "ml_confidence": inc.ml_confidence,
            "severity": inc.severity,
            "status": inc.status,
            "address": inc.address or inc.landmark,
            "created_at": inc.created_at.strftime("%Y-%m-%d %H:%M")
        } for inc in incidents
    ]

@router.get("/documents")
def list_knowledge_documents(current_user: User = Depends(require_admin)):
    docs_dir = os.path.abspath(settings.KNOWLEDGE_DOCS_DIR)
    meta_path = os.path.abspath(settings.CHUNKS_METADATA_PATH)
    total_chunks = len(rag_engine.chunks_metadata)

    doc_files = []
    if os.path.exists(docs_dir):
        for f in os.listdir(docs_dir):
            if f.endswith(".md") or f.endswith(".txt") or f.endswith(".pdf"):
                fpath = os.path.join(docs_dir, f)
                doc_files.append({
                    "filename": f,
                    "title": f.replace(".md", "").replace("_", " ").title(),
                    "size_bytes": os.path.getsize(fpath),
                    "last_modified": os.path.getmtime(fpath)
                })

    return {
        "documents": doc_files,
        "total_documents": len(doc_files),
        "total_chunks_indexed": total_chunks,
        "vector_index_path": settings.VECTOR_INDEX_PATH
    }

@router.post("/documents/reindex")
def trigger_reindex(current_user: User = Depends(require_admin)):
    """Triggers complete re-indexing of all source documents into FAISS."""
    rag_engine.index_documents()
    return {
        "message": f"Successfully re-indexed {len(rag_engine.chunks_metadata)} chunks into the vector store.",
        "total_chunks": len(rag_engine.chunks_metadata)
    }

@router.get("/export")
def export_incidents(
    format: str = "json",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    data = []
    for inc in incidents:
        data.append({
            "id": inc.id,
            "title": inc.title,
            "description": inc.description,
            "category": inc.category,
            "severity": inc.severity,
            "status": inc.status,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "address": inc.address,
            "landmark": inc.landmark,
            "obstruction_level": inc.obstruction_level,
            "affected_area_sqm": inc.affected_area_sqm,
            "reporter_id": inc.user_id,
            "is_duplicate_of": inc.is_duplicate_of,
            "review_required": inc.review_required,
            "created_at": inc.created_at.isoformat()
        })

    if format.lower() == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
            writer.writeheader()
            writer.writerows(data)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=civicmind_incidents.csv"}
        )

    return data
