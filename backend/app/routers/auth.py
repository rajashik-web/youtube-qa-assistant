from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
)

from app.services.auth_service import (
    AuthService,
)

from app.auth.dependencies import (
    get_current_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


auth_service = AuthService()


# --------------------------------
# Register user
# --------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
)
def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    try:

        user = auth_service.register_user(
            db=db,
            username=request.username.strip(),
            email=str(request.email).strip().lower(),
            password=request.password,
        )

        return user

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


# --------------------------------
# Login user
# --------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    try:

        access_token = auth_service.login_user(
            db=db,
            email=str(
                request.email
            ).strip().lower(),
            password=request.password,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except ValueError as error:

        raise HTTPException(
            status_code=401,
            detail=str(error),
        )


# --------------------------------
# Get current user
# --------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user_info(
    current_user: User = Depends(
        get_current_user
    ),
):

    return current_user