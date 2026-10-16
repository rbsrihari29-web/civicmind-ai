import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "CivicMind AI"
    ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # Security
    SECRET_KEY: str = "civicmind-dev-secret-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'civicmind.db'))}"

    # Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_IMAGE_SIZE_MB: int = 10

    # ML Model
    ML_MODEL_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "ml-training", "artifacts", "civicmind_mobilenetv3.pt")
    ML_METADATA_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "ml-training", "artifacts", "model_metadata.json")
    CONFIDENCE_THRESHOLD: float = 0.65

    # Local LLM & Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    LLM_FALLBACK_MODE: bool = True

    # RAG & Knowledge Base
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    VECTOR_INDEX_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "knowledge-base", "processed", "faiss_index.bin")
    CHUNKS_METADATA_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "knowledge-base", "processed", "chunks_metadata.json")
    KNOWLEDGE_DOCS_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "knowledge-base", "source-documents")
    SIMILARITY_TOP_K: int = 4

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
