from fastapi import (
    BackgroundTasks,
    FastAPI,
    HTTPException,
    Query,
)

from backend.app.schemas.video import (
    ProcessVideoRequest,
    ProcessVideoResponse,
    VideoListResponse,
    VideoStatusResponse,
)

from backend.app.schemas.question import (
    AskQuestionRequest,
    AskQuestionResponse,
)

from backend.app.services.rag_service import (
    RAGService,
)


app = FastAPI(
    title="YouTube Video Q&A Assistant",
    description="Ask questions about YouTube videos using RAG.",
    version="1.0.0",
)


rag_service = RAGService()


@app.get("/")
def root():

    return {
        "message": "YouTube Video Q&A Assistant API"
    }


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
            request.url.strip()
        )

        # Start background processing
        # only for newly added videos
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


@app.post(
    "/ask",
    response_model=AskQuestionResponse,
)
def ask_question(
    request: AskQuestionRequest,
):

    try:

        return rag_service.ask_question(
            video_id=request.video_id.strip(),
            question=request.question.strip(),
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }