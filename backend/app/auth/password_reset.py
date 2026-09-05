import hashlib
import secrets


def generate_reset_token() -> tuple[str, str]:
    """
    Generate a secure password-reset token.

    Returns:
        raw_token: Token sent to the user's email.
        token_hash: Hash stored in the database.
    """

    raw_token = secrets.token_urlsafe(32)

    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    return raw_token, token_hash


def hash_reset_token(token: str) -> str:
    """
    Hash a reset token for database lookup.
    """

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()