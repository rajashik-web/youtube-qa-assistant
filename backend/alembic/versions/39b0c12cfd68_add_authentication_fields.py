"""add authentication fields

Revision ID: 39b0c12cfd68
Revises: 1c029a2b1a16
Create Date: 2026-09-05 18:04:42.877541

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "39b0c12cfd68"
down_revision: Union[str, Sequence[str], None] = "1c029a2b1a16"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add the new columns as nullable first.
    op.add_column(
        "users",
        sa.Column(
            "auth_provider",
            sa.String(length=20),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=True,
        ),
    )

    # Existing users are local users.
    op.execute(
        "UPDATE users SET auth_provider = 'local' "
        "WHERE auth_provider IS NULL"
    )

    # Existing local users are considered verified.
    op.execute(
        "UPDATE users SET email_verified = TRUE "
        "WHERE email_verified IS NULL"
    )

    # Now enforce NOT NULL.
    op.alter_column(
        "users",
        "auth_provider",
        existing_type=sa.String(length=20),
        nullable=False,
    )

    op.alter_column(
        "users",
        "email_verified",
        existing_type=sa.Boolean(),
        nullable=False,
    )

    # Google users will have no password hash.
    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.VARCHAR(length=255),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.alter_column(
        "users",
        "password_hash",
        existing_type=sa.VARCHAR(length=255),
        nullable=False,
    )

    op.drop_column("users", "email_verified")
    op.drop_column("users", "auth_provider")