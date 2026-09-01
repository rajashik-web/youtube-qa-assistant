from sqlalchemy.orm import Session

from app.models.user import User

from app.auth.password import hash_password,verify_password

from app.auth.jwt import (
    create_access_token,
)

class AuthService:

    def register_user(
        self,
        db: Session,
        username: str,
        email: str,
        password: str,
    ) -> User:

        # Check existing email
        existing_user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing_user:

            raise ValueError(
                "Email is already registered."
            )

        # Hash password
        hashed_password = hash_password(
            password
        )

        # Create user
        user = User(
            username=username,
            email=email,
            password_hash=hashed_password,
        )

        db.add(user)

        db.commit()

        db.refresh(user)

        return user
    
    def login_user(
        self,
        db: Session,
        email: str,
        password: str,
    ) -> str:

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if not user:

            raise ValueError(
                "Invalid email or password."
            )

        password_valid = verify_password(
            password,
            user.password_hash,
        )

        if not password_valid:

            raise ValueError(
                "Invalid email or password."
            )

        access_token = create_access_token(
            user_id=user.id,
        )

        return access_token