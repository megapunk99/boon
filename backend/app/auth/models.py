"""Boon — User ORM Model.

Supports three roles:
- admin:   Full access to everything (the original user)
- operator: Can scan QR codes and view own history
- viewer:  Read-only access to scan history
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()),
    )
    username: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True,
    )
    email: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True,
    )
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    full_name: Mapped[str] = mapped_column(String(128), nullable=True, default=None)
    role: Mapped[str] = mapped_column(
        String(16), nullable=False, default="operator",
        comment="One of: admin, operator, viewer",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
