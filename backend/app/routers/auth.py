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
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.services.email_service import EmailService

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
email_service = EmailService()


# --------------------------------
# Register user
# --------------------------------


@router.post(
    "/register",
    response_model=UserResponse,
)
async def register_user(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    try:

        email = str(request.email).strip().lower()

        user = auth_service.register_user(
            db=db,
            username=request.username.strip(),
            email=email,
            password=request.password,
        )

        raw_token = auth_service.create_email_verification_token(
            db=db,
            user_id=user.id,
        )

        verification_url = (
            "http://localhost:5173/verify-email"
            f"?token={raw_token}"
        )

        await email_service.send_email_verification(
            email=user.email,
            verification_url=verification_url,
        )

        return user

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
        
# --------------------------------
# Verify email
# --------------------------------


@router.get(
    "/verify-email",
)
def verify_email(
    token: str,
    db: Session = Depends(get_db),
):

    try:

        auth_service.verify_email(
            db=db,
            token=token,
        )

        return {
            "message": "Email verified successfully."
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
        
# --------------------------------
# Resend verification email
# --------------------------------


@router.post(
    "/resend-verification",
)
async def resend_verification(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    email = str(request.email).strip().lower()

    user = db.query(User).filter(User.email == email).first()

    # Don't reveal whether the account exists.
    if not user:
        return {
            "message": (
                "If an unverified account exists for this email, "
                "a verification link has been sent."
            )
        }

    if user.email_verified:
        return {
            "message": "Email is already verified."
        }

    raw_token = auth_service.create_email_verification_token(
        db=db,
        user_id=user.id,
    )

    verification_url = (
        "http://localhost:5173/verify-email"
        f"?token={raw_token}"
    )

    await email_service.send_email_verification(
        email=user.email,
        verification_url=verification_url,
    )

    return {
        "message": (
            "If an unverified account exists for this email, "
            "a verification link has been sent."
        )
    }


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
            email=str(request.email).strip().lower(),
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
    current_user: User = Depends(get_current_user),
):

    return current_user


# --------------------------------
# Forgot password
# --------------------------------


@router.post(
    "/forgot-password",
)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):

    email = str(request.email).strip().lower()

    user, raw_token = auth_service.create_password_reset_token(
        db=db,
        email=email,
    )

    # Always return the same response
    # whether the email exists or not.
    if user and raw_token:

        reset_url = "http://localhost:5173/reset-password" f"?token={raw_token}"

        await email_service.send_password_reset_email(
            email=user.email,
            reset_url=reset_url,
        )

    return {
        "message": (
            "If an account exists for this email, "
            "a password reset link has been sent."
        )
    }


# --------------------------------
# Reset password
# --------------------------------


@router.post(
    "/reset-password",
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):

    try:

        auth_service.reset_password(
            db=db,
            token=request.token,
            new_password=request.new_password,
        )

        return {"message": "Password reset successfully."}

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
