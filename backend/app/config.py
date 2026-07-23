"""Boon — Configuration & Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Boon — Biomedical Waste Intelligence"
    app_version: str = "1.0.0"
    debug: bool = True
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins_regex: str = r"https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?"

    # CPCB compliance
    cpcb_state: str = "Karnataka"
    facility_registration: str = "KA-BMW-2025-001"

    # First-run admin user config
    admin_username: str = "admin"
    admin_password: str = ""
    admin_email: str = "admin@boon.local"
    admin_name: str = "System Administrator"

    model_config = {"env_prefix": "BOON_", "env_file": ".env", "extra": "allow"}


settings = Settings()
