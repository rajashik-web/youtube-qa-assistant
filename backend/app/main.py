from fastapi import FastAPI, HTTPException

from backend.app.schemas.video import (
    ProcessVideoRequest,
    ProcessVideoResponse,
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
):
    try:
        result = rag_service.process_video(
            request.url
        )

        return result

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
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
        result = rag_service.ask_question(
            video_id=request.video_id,
            question=request.question,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
        
    