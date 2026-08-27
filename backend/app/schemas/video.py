from pydantic import BaseModel


class ProcessVideoRequest(BaseModel):
    url: str


class ProcessVideoResponse(BaseModel):
    video_id: str
    segments: int = 0
    chunks: int = 0
    status: str


class VideoStatusResponse(BaseModel):
    video_id: str
    status: str
    segments: int
    chunks: int