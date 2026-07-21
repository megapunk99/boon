"""
Boon — Async Database Setup.

Provides async SQLite engine via SQLAlchemy (aiosqlite driver).
Supports both application and test usage with easy init/cleanup.
"""

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

# ── Database file location ────────────────────────────────────────────────
DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_PATH = DB_DIR / "boon.db"

# Allow override via env var (used by tests)
_DB_URL_OVERRIDE: str | None = os.environ.get("BOON_DATABASE_URL")

if _DB_URL_OVERRIDE:
    DATABASE_URL = _DB_URL_OVERRIDE
else:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# ── Engine & Session Factory ──────────────────────────────────────────────
engine = create_async_engine(
    DATABASE_URL,
    echo=False,                     # Set True for SQL debugging
    connect_args={"check_same_thread": False},  # Needed for SQLite
)

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Lifecycle Helpers ─────────────────────────────────────────────────────

async def init_db():
    """Create all tables. Safe to call on every startup (CREATE IF NOT EXISTS)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_db():
    """Drop all tables. Used by tests for clean teardown."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def get_session() -> AsyncSession:
    """Yield an async session (for use as a FastAPI dependency)."""
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_db():
    """Dispose of the engine (call on app shutdown)."""
    await engine.dispose()
