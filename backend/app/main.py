import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.models.entities import User, UserRole, Incident, IncidentStatus, SeverityLevel, CivicCategory
from app.security.auth import get_password_hash
from app.api.api import api_router
from app.rag.engine import rag_engine

app = FastAPI(
    title=settings.APP_NAME,
    description="Evidence-Aware AI Platform for Intelligent Civic Issue Detection, Risk Prediction, and Citizen Assistance.",
    version="1.0.0"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Router
app.include_router(api_router)

def seed_initial_demo_data():
    """Seeds default demo administrator and citizen accounts, and realistic Chennai civic records."""
    db = SessionLocal()
    try:
        # Check if users already exist
        admin = db.query(User).filter(User.email == "admin@civicmind.gov.in").first()
        if not admin:
            admin = User(
                email="admin@civicmind.gov.in",
                hashed_password=get_password_hash("Admin@CivicMind2026"),
                full_name="Dr. Sundaramurthy (Zonal Commissioner)",
                role=UserRole.ADMIN.value,
                phone="+91-9445191301"
            )
            db.add(admin)

        citizen = db.query(User).filter(User.email == "citizen@civicmind.org").first()
        if not citizen:
            citizen = User(
                email="citizen@civicmind.org",
                hashed_password=get_password_hash("Citizen@Pass123"),
                full_name="Kavitha Ramanathan",
                role=UserRole.CITIZEN.value,
                phone="+91-9840123456"
            )
            db.add(citizen)
        db.commit()

        # Seed initial realistic demonstration incidents if empty
        if db.query(Incident).count() == 0:
            demo_incidents = [
                Incident(
                    title="Deep Asphalt Crater on Usman Road Flyover Descent",
                    description="Severe pothole measuring approximately 0.8 meters wide and 8 cm deep right where vehicles descend from the flyover. Multiple two-wheelers observed losing balance.",
                    category=CivicCategory.POTHOLE_ROAD_DAMAGE.value,
                    user_category=CivicCategory.POTHOLE_ROAD_DAMAGE.value,
                    ml_category=CivicCategory.POTHOLE_ROAD_DAMAGE.value,
                    ml_confidence=0.96,
                    severity=SeverityLevel.HIGH.value,
                    severity_explanation="High Priority: Deep crater directly on fast descent of arterial flyover. Risk score: 75/100.",
                    status=IncidentStatus.SUBMITTED.value,
                    latitude=13.0418,
                    longitude=80.2337,
                    address="Usman Road, T. Nagar, Zone 10, Ward 136",
                    landmark="Near Panagal Park junction descent",
                    obstruction_level="lane_blocked",
                    affected_area_sqm=12.5,
                    user_id=citizen.id,
                    review_required=False
                ),
                Incident(
                    title="Overflowing Community Garbage Dump on Luz Church Road",
                    description="Three compactor bins have overflowed onto the pedestrian footpath for past 36 hours. Stray cattle and dogs scattering plastic waste across the carriage-way.",
                    category=CivicCategory.GARBAGE_ACCUMULATION.value,
                    user_category=CivicCategory.GARBAGE_ACCUMULATION.value,
                    ml_category=CivicCategory.GARBAGE_ACCUMULATION.value,
                    ml_confidence=0.98,
                    severity=SeverityLevel.MEDIUM.value,
                    severity_explanation="Medium Priority: Pedestrian blockage and public hygiene concern. Risk score: 45/100.",
                    status=IncidentStatus.UNDER_REVIEW.value,
                    latitude=13.0334,
                    longitude=80.2673,
                    address="Luz Church Road, Mylapore, Zone 9, Ward 124",
                    landmark="Opposite Luz Corner Bus Stop",
                    obstruction_level="partial_footpath",
                    affected_area_sqm=25.0,
                    user_id=citizen.id,
                    review_required=False
                ),
                Incident(
                    title="Monsoon Waterlogging & Clogged Drain at AGS Colony",
                    description="Standing stormwater depth reached 1.2 feet following moderate showers. Inlets to the stormwater canal appear completely choked with silt and plastic debris.",
                    category=CivicCategory.WATERLOGGING_FLOODING.value,
                    user_category=CivicCategory.WATERLOGGING_FLOODING.value,
                    ml_category=CivicCategory.WATERLOGGING_FLOODING.value,
                    ml_confidence=0.94,
                    severity=SeverityLevel.HIGH.value,
                    severity_explanation="High Priority: Water stagnant above 1 foot in residential area. Tier 1 Monsoon Hotspot. Risk score: 80/100.",
                    status=IncidentStatus.DISPATCHED.value,
                    latitude=12.9815,
                    longitude=80.2180,
                    address="4th Main Road, AGS Colony, Velachery, Zone 13, Ward 177",
                    landmark="Near Velachery Railway Station Link Road",
                    obstruction_level="lane_blocked",
                    affected_area_sqm=85.0,
                    user_id=citizen.id,
                    review_required=False
                ),
                Incident(
                    title="Uprooted Gulmohar Tree Blocking 2nd Avenue",
                    description="Heavy wind gusts uprooted a large municipal Gulmohar tree completely across the two-way lane. Overhead electrical wires are entangled.",
                    category=CivicCategory.FALLEN_TREE_OBSTRUCTION.value,
                    user_category=CivicCategory.FALLEN_TREE_OBSTRUCTION.value,
                    ml_category=CivicCategory.FALLEN_TREE_OBSTRUCTION.value,
                    ml_confidence=0.97,
                    severity=SeverityLevel.HIGH.value,
                    severity_explanation="High Emergency: Thoroughfare blocked and live wires involved. SLA: 2-6 Hours. Risk score: 95/100.",
                    status=IncidentStatus.IN_PROGRESS.value,
                    latitude=13.0850,
                    longitude=80.2101,
                    address="2nd Avenue, Anna Nagar, Zone 8, Ward 102",
                    landmark="Near Roundtana intersection",
                    obstruction_level="road_closed",
                    affected_area_sqm=40.0,
                    user_id=citizen.id,
                    review_required=False
                ),
                Incident(
                    title="Shattered Pedestrian Kerb & Missing Drain Slab",
                    description="Two slabs over the roadside storm drain have caved in, leaving a 3-foot deep open hole on the busy pedestrian walkway.",
                    category=CivicCategory.DAMAGED_INFRASTRUCTURE.value,
                    user_category=CivicCategory.DAMAGED_INFRASTRUCTURE.value,
                    ml_category=CivicCategory.DAMAGED_INFRASTRUCTURE.value,
                    ml_confidence=0.91,
                    severity=SeverityLevel.HIGH.value,
                    severity_explanation="High Priority: Uncovered drainage chamber constitutes extreme fall hazard. SLA: 1-6 Hours. Risk score: 70/100.",
                    status=IncidentStatus.RESOLVED.value,
                    latitude=13.0067,
                    longitude=80.2570,
                    address="LB Road, Adyar, Zone 13, Ward 173",
                    landmark="Near Adyar Depot junction",
                    obstruction_level="partial_footpath",
                    affected_area_sqm=6.0,
                    user_id=citizen.id,
                    review_required=False
                )
            ]
            db.add_all(demo_incidents)
            db.commit()
            print("[CivicMind AI] Successfully seeded initial demonstration records.")
    except Exception as e:
        print(f"[CivicMind AI] Seeding error: {e}")
        db.rollback()
    finally:
        db.close()

# Initialize DB schema and seed demo records on import
Base.metadata.create_all(bind=engine)
seed_initial_demo_data()

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_initial_demo_data()
    rag_engine.index_documents()

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "operational",
        "version": "1.0.0",
        "docs_url": "/docs",
        "api_prefix": "/api"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_model_loaded": os.path.exists(settings.ML_MODEL_PATH),
        "rag_chunks_indexed": len(rag_engine.chunks_metadata)
    }
