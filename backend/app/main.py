import os
from contextlib import asynccontextmanager
from app.services.rag_service import RAGService
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from starlette.middleware.sessions import SessionMiddleware

from app.database.database import engine

from app.models import (
    User,
    Conversation,
    Message,
    Video,
    QuestionCache,
    PasswordResetToken,
    EmailVerificationToken,
)
# Import routers
from app.routers import (
    auth,
    conversations,
    videos,
    questions,
)



@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.rag_service = RAGService()
    yield
    
# --------------------------------
# Create FastAPI app
# --------------------------------

app = FastAPI(
    title="YouTube Video Q&A Assistant",
    description="Ask questions about YouTube videos using RAG.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY"),
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