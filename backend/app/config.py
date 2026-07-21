"""Boon — Configuration & Settings."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Boon — Biomedical Waste Intelligence"
    app_version: str = "1.0.0"
    debug: bool = True
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins_regex: str = r"https?://localhost(:\d+)?"

    # CPCB compliance
    cpcb_state: str = "Karnataka"
    facility_registration: str = "KA-BMW-2025-001"

    model_config = {"env_prefix": "BOON_", "env_file": ".env", "extra": "allow"}


settings = Settings()
