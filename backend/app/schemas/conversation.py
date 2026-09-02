from datetime import datetime

from pydantic import BaseModel


class CreateConversationRequest(BaseModel):

    title: str | None = None


class ConversationResponse(BaseModel):

    id: int

    title: str | None

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):

    id: int

    role: str

    content: str

    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(
    ConversationResponse
):

    messages: list[MessageResponse]