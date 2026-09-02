from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.conversation import (
    Conversation,
)

from app.models.message import (
    Message,
)


class ConversationService:

    # --------------------------------
    # Create conversation
    # --------------------------------

    def create_conversation(
        self,
        db: Session,
        user_id: int,
        title: str | None = None,
    ) -> Conversation:

        conversation = Conversation(
            user_id=user_id,
            title=title,
        )

        db.add(
            conversation
        )

        db.commit()

        db.refresh(
            conversation
        )

        return conversation


    # --------------------------------
    # Get user's conversations
    # --------------------------------

    def get_user_conversations(
        self,
        db: Session,
        user_id: int,
    ) -> list[Conversation]:

        conversations = (
            db.query(Conversation)
            .filter(
                Conversation.user_id == user_id
            )
            .order_by(
                Conversation.updated_at.desc()
            )
            .all()
        )

        return conversations


    # --------------------------------
    # Get single conversation
    # --------------------------------

    def get_conversation(
        self,
        db: Session,
        conversation_id: int,
        user_id: int,
    ) -> Conversation | None:

        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            .first()
        )

        return conversation


    # --------------------------------
    # Add message
    # --------------------------------

    def add_message(
        self,
        db: Session,
        conversation_id: int,
        role: str,
        content: str,
    ) -> Message:

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
        )

        db.add(
            message
        )

        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id
            )
            .first()
        )

        if conversation:

            conversation.updated_at = func.now()

        db.commit()

        db.refresh(
            message
        )

        return message
    
    # --------------------------------
    # Delete conversation
    # --------------------------------

    def delete_conversation(
        self,
        db: Session,
        conversation_id: int,
        user_id: int,
    ) -> bool:

        conversation = (
            self.get_conversation(
                db=db,
                conversation_id=conversation_id,
                user_id=user_id,
            )
        )

        if conversation is None:

            return False

        db.delete(
            conversation
        )

        db.commit()

        return True
    
    # --------------------------------
    # Generate conversation title
    # --------------------------------

    def generate_title(
        self,
        question: str,
    ) -> str:

        words = question.strip().split()

        title_words = words[:6]

        title = " ".join(
            title_words
        )

        return title
    
    # --------------------------------
    # Update conversation title
    # --------------------------------

    def update_title(
        self,
        db: Session,
        conversation_id: int,
        title: str,
    ) -> Conversation | None:

        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == conversation_id
            )
            .first()
        )

        if conversation is None:

            return None

        conversation.title = title

        db.commit()

        db.refresh(
            conversation
        )

        return conversation