from pydantic import BaseModel


class AskQuestionRequest(BaseModel):
    video_id: str
    question: str


class Source(BaseModel):
    start_time: float
    end_time: float
    score: float


class AskQuestionResponse(BaseModel):
    answer: str
    sources: list[Source]