"""Boon — First-Run Setup Script.

Auto-creates the default admin user on first application startup.
Also provides a standalone CLI mode for manual admin management.

Configuration via environment variables (all optional with sensible defaults):
    BOON_ADMIN_USERNAME   — Admin username (default: "admin")
    BOON_ADMIN_PASSWORD   — Admin password (default: auto-generated, printed to console)
    BOON_ADMIN_EMAIL      — Admin email (default: "admin@boon.local")
    BOON_ADMIN_NAME       — Admin display name (default: "System Administrator")
"""

import os
import argparse
import secrets
import string
import getpass

# ── Load centralized settings (with env var override support) ─────────────
# Importing app.config.settings triggers env parsing via pydantic-settings.
# The BOON_ADMIN_* env vars map to fields admin_* due to env_prefix="BOON_".
try:
    from app.config import settings
    DEFAULT_ADMIN_USERNAME = settings.admin_username
    DEFAULT_ADMIN_PASSWORD = settings.admin_password
    DEFAULT_ADMIN_EMAIL = settings.admin_email
    DEFAULT_ADMIN_NAME = settings.admin_name
except ImportError:
    # Fallback when running standalone outside the project context
    DEFAULT_ADMIN_USERNAME = os.environ.get("BOON_ADMIN_USERNAME", "admin")
    DEFAULT_ADMIN_PASSWORD = os.environ.get("BOON_ADMIN_PASSWORD", "")
    DEFAULT_ADMIN_EMAIL = os.environ.get("BOON_ADMIN_EMAIL", "admin@boon.local")
    DEFAULT_ADMIN_NAME = os.environ.get("BOON_ADMIN_NAME", "System Administrator")


# ── Database Setup Utility ────────────────────────────────────────────────

async def ensure_admin_exists(dry_run: bool = False) -> dict:
    """Check if an admin user exists; if not, create one with defaults.

    Returns a dict with keys:
        action: "created" | "skipped" | "error"
        username: the admin username
        password: the admin password (only on creation)
        message: human-readable status
    """
    # Late imports to avoid circular dependencies
    from sqlalchemy import select
    from app.database import SessionLocal
    from app.auth.models import User
    from app.auth.utils import hash_password

    async with SessionLocal() as session:
        try:
            # Check if any admin user already exists
            result = await session.execute(
                select(User).where(User.role == "admin").limit(1)
            )
            existing_admin = result.scalar_one_or_none()

            if existing_admin is not None:
                return {
                    "action": "skipped",
                    "username": existing_admin.username,
                    "message": (
                        f"Admin user already exists: '{existing_admin.username}' "
                        f"(email: {existing_admin.email})"
                    ),
                }

            if dry_run:
                return {
                    "action": "dry_run",
                    "username": DEFAULT_ADMIN_USERNAME,
                    "message": f"Would create admin user '{DEFAULT_ADMIN_USERNAME}'",
                }

            # No admin exists — create one
            password = DEFAULT_ADMIN_PASSWORD
            generated = False
            if not password:
                # Generate a strong random password
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password = "".join(secrets.choice(alphabet) for _ in range(20))
                generated = True

            admin_user = User(
                username=DEFAULT_ADMIN_USERNAME,
                email=DEFAULT_ADMIN_EMAIL,
                hashed_password=hash_password(password),
                full_name=DEFAULT_ADMIN_NAME,
                role="admin",
                is_active=True,
            )
            session.add(admin_user)
            await session.commit()

            msg = (
                f"[OK] Auto-created admin user:\n"
                f"   Username: {DEFAULT_ADMIN_USERNAME}\n"
                f"   Email:    {DEFAULT_ADMIN_EMAIL}\n"
            )
            if generated:
                msg += (
                    f"   Password: {password}\n"
                    f"   [NOTE] This password was auto-generated. Set BOON_ADMIN_PASSWORD\n"
                    f"   in your environment or .env file to control it.\n"
                )
            else:
                msg += f"   Password: [set via BOON_ADMIN_PASSWORD env var]\n"

            print(msg)

            return {
                "action": "created",
                "username": DEFAULT_ADMIN_USERNAME,
                "password": password if generated else "[env var]",
                "message": msg.strip(),
            }

        except Exception as exc:
            error_msg = f"[FAIL] Failed to create admin user: {exc}"
            print(error_msg)
            return {
                "action": "error",
                "username": DEFAULT_ADMIN_USERNAME,
                "message": error_msg,
            }


# ── Standalone CLI Mode ───────────────────────────────────────────────────

def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments for standalone mode."""
    parser = argparse.ArgumentParser(
        description="Boon Admin Setup — Manage the first admin user.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python -m app.auth.setup              # Create admin (if missing)\n"
            "  python -m app.auth.setup --reset       # Create/reset admin password\n"
            "  python -m app.auth.setup --dry-run     # Preview without making changes\n"
            "  python -m app.auth.setup --username=root --email=root@boon.local\n"
        ),
    )
    parser.add_argument(
        "--username",
        default=DEFAULT_ADMIN_USERNAME,
        help=f"Admin username (default: {DEFAULT_ADMIN_USERNAME})",
    )
    parser.add_argument(
        "--email",
        default=DEFAULT_ADMIN_EMAIL,
        help=f"Admin email (default: {DEFAULT_ADMIN_EMAIL})",
    )
    parser.add_argument(
        "--name",
        default=DEFAULT_ADMIN_NAME,
        help=f"Admin display name (default: {DEFAULT_ADMIN_NAME})",
    )
    parser.add_argument(
        "--password",
        help="Admin password (if omitted, you'll be prompted or one is generated)",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset admin password even if admin already exists",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check if admin exists without making changes",
    )
    parser.add_argument(
        "--show",
        action="store_true",
        help="Show current admin user info (if any)",
    )
    return parser.parse_args(argv)


async def _show_admins():
    """Display existing admin users."""
    from sqlalchemy import select
    from app.database import SessionLocal
    from app.auth.models import User

    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.role == "admin").order_by(User.created_at)
        )
        admins = result.scalars().all()

    if not admins:
        print("No admin users found in the database.")
        return

    print(f"Found {len(admins)} admin user(s):\n")
    for i, u in enumerate(admins, 1):
        print(f"  {i}. {u.username} ({u.full_name or 'no name'})")
        print(f"     Email: {u.email}")
        print(f"     Active: {u.is_active}")
        print(f"     Created: {u.created_at}")
        print()


async def _reset_admin(args: argparse.Namespace):
    """Reset the admin user's password."""
    from sqlalchemy import select
    from app.database import SessionLocal
    from app.auth.models import User
    from app.auth.utils import hash_password

    async with SessionLocal() as session:
        result = await session.execute(
            select(User).where(User.role == "admin").limit(1)
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print("No admin user found. Use without --reset to create one.")
            return

        password = args.password
        if not password:
            password = getpass.getpass("New password for admin (leave blank to generate): ")
            if not password:
                alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
                password = "".join(secrets.choice(alphabet) for _ in range(16))
                print(f"\nAuto-generated password: {password}")

        admin.hashed_password = hash_password(password)
        await session.commit()

        print(f"[OK] Password updated for admin '{admin.username}'.")


def main_cli():
    """Entry point for standalone CLI usage: python -m app.auth.setup"""
    import asyncio
    args = _parse_args()

    # Override defaults with CLI args
    global DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_PASSWORD
    if args.username:
        DEFAULT_ADMIN_USERNAME = args.username
        os.environ["BOON_ADMIN_USERNAME"] = args.username
    if args.email:
        DEFAULT_ADMIN_EMAIL = args.email
        os.environ["BOON_ADMIN_EMAIL"] = args.email
    if args.name:
        DEFAULT_ADMIN_NAME = args.name
    if args.password:
        DEFAULT_ADMIN_PASSWORD = args.password
        os.environ["BOON_ADMIN_PASSWORD"] = args.password

    if args.show:
        asyncio.run(_show_admins())
        return

    if args.reset:
        asyncio.run(_reset_admin(args))
        return

    result = asyncio.run(ensure_admin_exists(dry_run=args.dry_run))
    print(result["message"])


if __name__ == "__main__":
    main_cli()
