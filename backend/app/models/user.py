from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class User(Base):

    __tablename__ = "users"


    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )


    username = Column(
        String(100),
        nullable=False,
    )


    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )


    password_hash = Column(
        String(255),
        nullable=False,
    )


    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    
    conversations = relationship(
    "Conversation",
    back_populates="user",
    cascade="all, delete-orphan",
)