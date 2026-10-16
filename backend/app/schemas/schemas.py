from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.entities import UserRole, IncidentStatus, SeverityLevel, CivicCategory, DuplicateStatus

# --- User & Auth Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    role: Optional[str] = UserRole.CITIZEN.value
    phone: Optional[str] = None
    privacy_blur_location: Optional[bool] = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

# --- Incident Schemas ---
class IncidentImageResponse(BaseModel):
    id: int
    file_path: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    ml_predicted_class: Optional[str] = None
    ml_confidence: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    user_category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    landmark: Optional[str] = None
    obstruction_level: Optional[str] = "none"
    affected_area_sqm: Optional[float] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    obstruction_level: Optional[str] = None
    admin_notes: Optional[str] = None
    review_required: Optional[bool] = None

class IncidentStatusHistoryResponse(BaseModel):
    id: int
    previous_status: Optional[str]
    new_status: str
    changed_by_id: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    user_category: Optional[str]
    ml_category: Optional[str]
    ml_confidence: Optional[float]
    severity: str
    severity_explanation: Optional[str]
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    landmark: Optional[str]
    obstruction_level: Optional[str]
    affected_area_sqm: Optional[float]
    user_id: int
    is_duplicate_of: Optional[int]
    review_required: bool
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    images: List[IncidentImageResponse] = []
    reporter: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- ML & Analysis Schemas ---
class ClassProbability(BaseModel):
    category: str
    label: str
    probability: float

class ImageAnalysisResponse(BaseModel):
    predicted_category: str
    category_label: str
    confidence: float
    is_low_confidence: bool
    review_required: bool
    model_version: str
    class_probabilities: List[ClassProbability]
    alternative_predictions: List[ClassProbability]
    model_trained: bool

class SeverityAssessmentResponse(BaseModel):
    level: str  # low, medium, high, unknown
    score: float
    factors: List[str]
    is_rule_based: bool
    confidence: float
    explanation: str

# --- Duplicate Detection Schemas ---
class DuplicateSignalBreakdown(BaseModel):
    text_similarity: float
    geographic_proximity_score: float
    category_match_score: float
    temporal_proximity_score: float
    image_similarity_score: float

class DuplicateMatchCandidate(BaseModel):
    candidate_id: int
    candidate_title: str
    candidate_category: str
    candidate_created_at: datetime
    candidate_address: Optional[str]
    candidate_distance_meters: Optional[float]
    composite_score: float
    confidence_level: str  # High, Medium, Low
    signal_breakdown: DuplicateSignalBreakdown
    explanation: str

class DuplicateReviewAction(BaseModel):
    action: str  # confirm_duplicate, dismiss
    parent_incident_id: Optional[int] = None
    notes: Optional[str] = None

# --- RAG & AI Assistant Schemas ---
class CitationSource(BaseModel):
    document_title: str
    organization: str
    section: Optional[str] = None
    page: Optional[int] = None
    source_url: Optional[str] = None
    excerpt: str
    relevance_score: float

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    incident_id: Optional[int] = None
    message: str = Field(..., min_length=1)

class ChatResponse(BaseModel):
    conversation_id: int
    message_id: int
    response: str
    citations: List[CitationSource] = []
    is_grounded: bool = True
    grounding_confidence: str  # High, Partial, Insufficient Evidence
    suggested_follow_ups: List[str] = []

class ComplaintDraftRequest(BaseModel):
    incident_id: int
    recipient_authority: Optional[str] = None
    include_statutory_deadlines: bool = True

class ComplaintDraftResponse(BaseModel):
    incident_id: int
    subject: str
    salutation: str
    body: str
    recipient_department: str
    statutory_sla_days: int
    statutory_reference: str
    evidence_checklist: List[str]
    disclaimer: str

# --- Knowledge Base Schemas ---
class DocumentChunkResponse(BaseModel):
    id: int
    chunk_index: int
    section: Optional[str]
    page_number: Optional[int]
    content: str

    class Config:
        from_attributes = True

class KnowledgeDocumentResponse(BaseModel):
    id: int
    title: str
    organization: str
    source_url: Optional[str]
    document_type: str
    publication_date: Optional[str]
    last_verified_date: Optional[str]
    total_chunks: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class CategoryStat(BaseModel):
    category: str
    label: str
    count: int
    percentage: float

class TrendPoint(BaseModel):
    date: str
    total_incidents: int
    resolved_incidents: int
    potholes: int
    garbage: int
    waterlogging: int

class HotspotPoint(BaseModel):
    id: int
    title: str
    category: str
    severity: str
    latitude: float
    longitude: float
    address: Optional[str]
    created_at: str

class AnalyticsOverview(BaseModel):
    total_incidents: int
    resolved_incidents: int
    in_progress_incidents: int
    pending_review_incidents: int
    average_resolution_time_hours: float
    category_distribution: List[CategoryStat]
    severity_distribution: Dict[str, int]
    status_distribution: Dict[str, int]
    hotspots: List[HotspotPoint]
