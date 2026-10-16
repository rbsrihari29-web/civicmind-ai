import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"

class IncidentStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    DISPATCHED = "dispatched"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class SeverityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    UNKNOWN = "unknown"

class CivicCategory(str, enum.Enum):
    POTHOLE_ROAD_DAMAGE = "pothole_road_damage"
    GARBAGE_ACCUMULATION = "garbage_accumulation"
    WATERLOGGING_FLOODING = "waterlogging_flooding"
    DAMAGED_INFRASTRUCTURE = "damaged_infrastructure"
    FALLEN_TREE_OBSTRUCTION = "fallen_tree_obstruction"
    OTHER_UNCERTAIN = "other_uncertain"

class DuplicateStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED_DUPLICATE = "confirmed_duplicate"
    DISMISSED = "dismissed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.CITIZEN.value, nullable=False)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    privacy_blur_location = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.user_id")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), default=CivicCategory.OTHER_UNCERTAIN.value, index=True)
    user_category = Column(String(100), nullable=True)
    ml_category = Column(String(100), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    severity = Column(String(50), default=SeverityLevel.UNKNOWN.value, index=True)
    severity_explanation = Column(Text, nullable=True)
    status = Column(String(50), default=IncidentStatus.SUBMITTED.value, index=True)
    
    # Location
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    address = Column(String(500), nullable=True)
    landmark = Column(String(255), nullable=True)

    # Physical parameters
    obstruction_level = Column(String(100), default="none")  # none, partial_footpath, lane_blocked, road_closed
    affected_area_sqm = Column(Float, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_duplicate_of = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    review_required = Column(Boolean, default=False)
    admin_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    reporter = relationship("User", back_populates="incidents", foreign_keys=[user_id])
    images = relationship("IncidentImage", back_populates="incident", cascade="all, delete-orphan")
    status_history = relationship("IncidentStatusHistory", back_populates="incident", cascade="all, delete-orphan")
    duplicate_candidates = relationship("DuplicateCandidate", back_populates="incident", foreign_keys="DuplicateCandidate.incident_id", cascade="all, delete-orphan")

class IncidentImage(Base):
    __tablename__ = "incident_images"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    
    # ML inference outputs cached on the image
    ml_predicted_class = Column(String(100), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    class_probabilities = Column(JSON, nullable=True)
    image_embedding = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="images")

class DuplicateCandidate(Base):
    __tablename__ = "duplicate_candidates"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    candidate_incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    
    composite_score = Column(Float, nullable=False)
    text_score = Column(Float, nullable=False)
    geo_score = Column(Float, nullable=False)
    cat_score = Column(Float, nullable=False)
    time_score = Column(Float, nullable=False)
    img_score = Column(Float, nullable=False)
    
    status = Column(String(50), default=DuplicateStatus.PENDING.value)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", foreign_keys=[incident_id], back_populates="duplicate_candidates")
    candidate_incident = relationship("Incident", foreign_keys=[candidate_incident_id])

class IncidentStatusHistory(Base):
    __tablename__ = "incident_status_history"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    incident = relationship("Incident", back_populates="status_history")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    source_url = Column(String(500), nullable=True)
    document_type = Column(String(100), default="guideline")  # charter, act, sops, bylaw, manual
    publication_date = Column(String(50), nullable=True)
    last_verified_date = Column(String(50), nullable=True)
    total_chunks = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    section = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("KnowledgeDocument", back_populates="chunks")

class AssistantConversation(Base):
    __tablename__ = "assistant_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)
    title = Column(String(255), default="Civic AI Consultation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("AssistantMessage", back_populates="conversation", cascade="all, delete-orphan")

class AssistantMessage(Base):
    __tablename__ = "assistant_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("assistant_conversations.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    citations = Column(JSON, nullable=True)
    is_grounded = Column(Boolean, default=True)
    confidence_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversation = relationship("AssistantConversation", back_populates="messages")

class EvaluationRecord(Base):
    __tablename__ = "evaluation_records"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    evaluation_type = Column(String(50), nullable=False)  # image_classification, duplicate_detection, rag_retrieval
    metrics_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
