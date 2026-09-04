from fastapi import (
    APIRouter,
    BackgroundTasks,
    HTTPException,
    Query,
)

from app.schemas.video import (
    ProcessVideoRequest,
    ProcessVideoResponse,
    VideoListResponse,
    VideoStatusResponse,
)

from app.services.rag_service import (
    RAGService,
)


router = APIRouter(
    tags=["Videos"],
)


rag_service = RAGService()


# --------------------------------
# Process video
# --------------------------------

@router.post(
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

@router.get(
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

@router.get(
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

@router.delete(
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