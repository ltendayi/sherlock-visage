"""
Configuration settings for Sherlock Visage Backend
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn, validator

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        env="CORS_ORIGINS"
    )
    
    # PostgreSQL Database
    POSTGRES_HOST: str = Field(default="localhost", env="POSTGRES_HOST")
    POSTGRES_PORT: int = Field(default=5432, env="POSTGRES_PORT")
    POSTGRES_DB: str = Field(default="shavi_dev_db", env="POSTGRES_DB")
    POSTGRES_USER: str = Field(default="postgres", env="POSTGRES_USER")
    POSTGRES_PASSWORD: str = Field(default="", env="POSTGRES_PASSWORD")
    POSTGRES_URI: Optional[PostgresDsn] = None
    
    # SQLite Database
    SQLITE_PATH: str = Field(
        default=str(Path.home() / ".hermes" / "state.db"),
        env="SQLITE_PATH"
    )
    
    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        env="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # API Settings
    API_V1_STR: str = "/api/v1"
    
    # Frontend
    SERVE_FRONTEND: bool = Field(default=True, env="SERVE_FRONTEND")
    FRONTEND_DIR: str = Field(
        default=str(Path(__file__).parent.parent.parent / "sherlock-visage/dist"),
        env="FRONTEND_DIR"
    )
    
    # WebSocket
    WEBSOCKET_PING_INTERVAL: int = Field(default=20, env="WEBSOCKET_PING_INTERVAL")
    WEBSOCKET_PING_TIMEOUT: int = Field(default=20, env="WEBSOCKET_PING_TIMEOUT")
    
    @validator("POSTGRES_URI", pre=True)
    def assemble_postgres_uri(cls, v: Optional[str], values: dict) -> str:
        """Construct PostgreSQL URI from components"""
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_HOST"),
            port=str(values.get("POSTGRES_PORT")),
            path=f"{values.get('POSTGRES_DB') or ''}",
        )
    
    @validator("SQLITE_PATH")
    def validate_sqlite_path(cls, v: str) -> str:
        """Ensure SQLite database exists or create directory"""
        path = Path(v)
        if not path.parent.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()