from fastapi import APIRouter
from app.api.endpoints import auth, incidents, assistant, analytics, admin

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(incidents.router)
api_router.include_router(assistant.router)
api_router.include_router(analytics.router)
api_router.include_router(admin.router)
