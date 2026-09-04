from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.auth.dependencies import (
    get_current_user,
)

from app.models.user import User
from app.models.message import Message

from app.schemas.conversation import (
    CreateConversationRequest,
    ConversationResponse,
    ConversationDetailResponse,
    UpdateConversationRequest,
    PaginatedMessagesResponse,
)

from app.services.conversation_service import (
    ConversationService,
)


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


conversation_service = ConversationService()


# --------------------------------
# Create conversation
# --------------------------------

@router.post(
    "",
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

@router.get(
    "",
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
# Get paginated conversation messages
# IMPORTANT: This route must come BEFORE
# /{conversation_id}
# --------------------------------

@router.get(
    "/{conversation_id}/messages",
    response_model=PaginatedMessagesResponse,
)
def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    before_id: int | None = Query(
        default=None,
        ge=1,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    messages = (
        conversation_service.get_messages(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
            limit=limit,
            before_id=before_id,
        )
    )

    if messages is None:

        raise HTTPException(
            status_code=404,
            detail="Conversation not found.",
        )

    next_cursor = None

    if messages:

        oldest_message_id = messages[0].id

        older_message_exists = (
            db.query(Message)
            .filter(
                Message.conversation_id
                == conversation_id,
                Message.id < oldest_message_id,
            )
            .first()
        )

        if older_message_exists:

            next_cursor = oldest_message_id

    return {
        "messages": messages,
        "next_cursor": next_cursor,
    }


# --------------------------------
# Get conversation
# --------------------------------

@router.get(
    "/{conversation_id}",
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
# Update conversation title
# --------------------------------

@router.patch(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
def update_conversation_title(
    conversation_id: int,
    request: UpdateConversationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    conversation = (
        conversation_service.update_conversation_title(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
            title=request.title,
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

@router.delete(
    "/{conversation_id}",
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
        "message": "Conversation deleted successfully."
    }