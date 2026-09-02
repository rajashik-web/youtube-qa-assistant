from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Query,
)

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from sqlalchemy.orm import Session

from app.database.database import (
    Base,
    engine,
    get_db,
)

from app.auth.dependencies import (
    get_current_user_optional,
)


from app.auth.dependencies import (
    get_current_user,
)

from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

from app.services.conversation_service import (
    ConversationService,
)

from app.schemas.conversation import (
    ConversationDetailResponse,
    ConversationResponse,
    CreateConversationRequest,
)

from app.services.auth_service import (
    AuthService,
)

# Import models before create_all()
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message

from app.schemas.video import (
    ProcessVideoRequest,
    ProcessVideoResponse,
    VideoListResponse,
    VideoStatusResponse,
)

from app.schemas.question import (
    AskQuestionRequest,
    AskQuestionResponse,
)

from app.services.rag_service import (
    RAGService,
)


# --------------------------------
# Create database tables
# --------------------------------

Base.metadata.create_all(
    bind=engine
)


# --------------------------------
# Create FastAPI application
# --------------------------------

app = FastAPI(
    title="YouTube Video Q&A Assistant",
    description="Ask questions about YouTube videos using RAG.",
    version="1.0.0",
)


# --------------------------------
# CORS Configuration
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
# Initialize RAG service
# --------------------------------

rag_service = RAGService()

auth_service = AuthService()

conversation_service = ConversationService()


# --------------------------------
# Root endpoint
# --------------------------------

@app.get("/")
def root():

    return {
        "message": "YouTube Video Q&A Assistant API"
    }


# --------------------------------
# Process video
# --------------------------------

@app.post(
    "/process-video",
    response_model=ProcessVideoResponse,
)
def process_video(
    request: ProcessVideoRequest,
    background_tasks: BackgroundTasks,
):

    try:

        result = rag_service.process_video(
            url=request.url.strip(),
            force_reprocess=request.force_reprocess,
        )

        # Start background processing
        if result["status"] == "processing":

            background_tasks.add_task(
                rag_service.process_video_background,
                result["video_id"],
            )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred "
                "while processing the video."
            ),
        )


# --------------------------------
# Get all videos
# --------------------------------

@app.get(
    "/videos",
    response_model=VideoListResponse,
)
def get_all_videos(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    status: str | None = Query(
        default=None,
    ),
):

    if status:

        status = status.strip().lower()

    return rag_service.get_all_videos(
        limit=limit,
        offset=offset,
        status=status,
    )


# --------------------------------
# Get video status
# --------------------------------

@app.get(
    "/video/{video_id}/status",
    response_model=VideoStatusResponse,
)
def get_video_status(
    video_id: str,
):

    video_id = video_id.strip()

    video = rag_service.video_storage.get_video(
        video_id
    )

    if video is None:

        raise HTTPException(
            status_code=404,
            detail="Video not found.",
        )

    return {
        "video_id": video["video_id"],
        "title": video["title"],
        "thumbnail_url": video["thumbnail_url"],
        "status": video["status"],
        "segments": video["segments"],
        "chunks": video["chunks"],
    }


# --------------------------------
# Delete video
# --------------------------------

@app.delete(
    "/video/{video_id}",
)
def delete_video(
    video_id: str,
):

    try:

        result = rag_service.delete_video(
            video_id.strip()
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


# --------------------------------
# Ask question
# --------------------------------

@app.post(
    "/ask",
    response_model=AskQuestionResponse,
)
def ask_question(
    request: AskQuestionRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(
        get_current_user_optional
    ),
):

    try:

        # ----------------------------
        # Guest user
        # ----------------------------

        if current_user is None:

            return rag_service.ask_question(
                video_id=request.video_id.strip(),
                question=request.question.strip(),
            )


        # ----------------------------
        # Logged-in user without
        # conversation ID
        # ----------------------------

        if request.conversation_id is None:

            return rag_service.ask_question(
                video_id=request.video_id.strip(),
                question=request.question.strip(),
            )


        # ----------------------------
        # Verify conversation ownership
        # ----------------------------

        conversation = (
            conversation_service.get_conversation(
                db=db,
                conversation_id=request.conversation_id,
                user_id=current_user.id,
            )
        )

        if conversation is None:

            raise HTTPException(
                status_code=404,
                detail="Conversation not found.",
            )
            
        # ----------------------------
        # Generate title if missing
        # ----------------------------

        if not conversation.title:

            title = (
                conversation_service.generate_title(
                    request.question
                )
            )

            conversation_service.update_title(
                db=db,
                conversation_id=conversation.id,
                title=title,
            )


        # ----------------------------
        # Save user question
        # ----------------------------

        conversation_service.add_message(
            db=db,
            conversation_id=conversation.id,
            role="user",
            content=request.question.strip(),
        )


        # ----------------------------
        # Generate RAG answer
        # ----------------------------

        result = rag_service.ask_question(
            video_id=request.video_id.strip(),
            question=request.question.strip(),
        )


        # ----------------------------
        # Save AI answer
        # ----------------------------

        conversation_service.add_message(
            db=db,
            conversation_id=conversation.id,
            role="assistant",
            content=result["answer"],
        )


        return result


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )



# --------------------------------
# Register user
# --------------------------------

@app.post(
    "/auth/register",
    response_model=UserResponse,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    try:

        user = auth_service.register_user(
            db=db,
            username=request.username.strip(),
            email=str(request.email).strip().lower(),
            password=request.password,
        )

        return user

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
        
# --------------------------------
# Login user
# --------------------------------

@app.post(
    "/auth/login",
    response_model=TokenResponse,
)
def login_user(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    try:

        access_token = auth_service.login_user(
            db=db,
            email=str(
                request.email
            ).strip().lower(),
            password=request.password,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except ValueError as error:

        raise HTTPException(
            status_code=401,
            detail=str(error),
        )
        
# --------------------------------
# Get current user
# --------------------------------

@app.get(
    "/auth/me",
    response_model=UserResponse,
)
def get_current_user_info(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user

# --------------------------------
# Create conversation
# --------------------------------

@app.post(
    "/conversations",
    response_model=ConversationResponse,
)
def create_conversation(
    request: CreateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    conversation = (
        conversation_service.create_conversation(
            db=db,
            user_id=current_user.id,
            title=request.title,
        )
    )

    return conversation

# --------------------------------
# Get user conversations
# --------------------------------

@app.get(
    "/conversations",
    response_model=list[ConversationResponse],
)
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    return (
        conversation_service.get_user_conversations(
            db=db,
            user_id=current_user.id,
        )
    )
    
# --------------------------------
# Get conversation
# --------------------------------

@app.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    conversation = (
        conversation_service.get_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
        )
    )

    if conversation is None:

        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return conversation

# --------------------------------
# Delete conversation
# --------------------------------

@app.delete(
    "/conversations/{conversation_id}",
)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    deleted = (
        conversation_service.delete_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
        )
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    return {
        "message": (
            "Conversation deleted successfully."
        )
    }


# --------------------------------
# Health check
# --------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }