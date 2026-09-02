from pydantic import BaseModel, Field


class AskQuestionRequest(BaseModel):

    video_id: str = Field(
        ...,
        min_length=1,
        description="YouTube video ID",
    )

    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Question about the video",
    )

    conversation_id: int | None = Field(
        default=None,
        description=(
            "Conversation ID for logged-in users. "
            "Leave empty for guest questions."
        ),
    )


class SourceResponse(BaseModel):

    start_time: float
    end_time: float

    start_time_formatted: str
    end_time_formatted: str

    url: str

    score: float


class AskQuestionResponse(BaseModel):

    answer: str

    sources: list[SourceResponse]