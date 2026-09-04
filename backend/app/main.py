from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import (
    Base,
    engine,
)

# Import models so SQLAlchemy registers them
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message

# Import routers
from app.routers import (
    auth,
    conversations,
    videos,
    questions,
)


# --------------------------------
# Create database tables
# --------------------------------

Base.metadata.create_all(
    bind=engine
)


# --------------------------------
# Create FastAPI app
# --------------------------------

app = FastAPI(
    title="YouTube Q&A Assistant API",
    version="1.0.0",
)


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Include routers
# --------------------------------

app.include_router(
    auth.router
)

app.include_router(
    conversations.router
)

app.include_router(
    videos.router
)

app.include_router(
    questions.router
)


# --------------------------------
# Root endpoint
# --------------------------------

@app.get("/")
def root():

    return {
        "message": "YouTube Video Q&A Assistant API"
    }


# --------------------------------
# Health check
# --------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }