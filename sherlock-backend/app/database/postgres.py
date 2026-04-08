"""
PostgreSQL database configuration and models for project data
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, 
    ForeignKey, Text, JSON, BigInteger, Index, text
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from datetime import datetime
from app.core.config import settings

# Create async engine for PostgreSQL
engine = create_async_engine(
    str(settings.POSTGRES_URI),
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for PostgreSQL models
Base = declarative_base()

class Tenant(Base):
    """Tenant/organization model for multi-tenancy"""
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    projects = relationship("Project", back_populates="tenant", cascade="all, delete-orphan")
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_users_tenant_email", "tenant_id", "email", unique=True),
    )

class APIKey(Base):
    """API Key model for programmatic access"""
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    key = Column(String(64), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_used = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="api_keys")
    
    __table_args__ = (
        Index("idx_api_keys_user", "user_id", "is_active"),
    )

class Project(Base):
    """Project model for managing different projects/workspaces"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # active, archived, completed
    metadata = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="projects")
    agent_sessions = relationship("AgentSession", back_populates="project", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_projects_tenant_status", "tenant_id", "status"),
        Index("idx_projects_tenant_name", "tenant_id", "name", unique=True),
    )

class AgentSession(Base):
    """Agent session model for tracking agent operations"""
    __tablename__ = "agent_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    agent_type = Column(String(100), nullable=False, index=True)  # e.g., "hermes", "delegate", "tool"
    status = Column(String(50), default="running", nullable=False)  # running, completed, failed, terminated
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    total_cost = Column(Float, default=0.0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    metadata = Column(JSON, nullable=True, default=dict)
    
    # Relationships
    project = relationship("Project", back_populates="agent_sessions")
    operations = relationship("AgentOperation", back_populates="session", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_sessions_project_status", "project_id", "status"),
        Index("idx_sessions_agent_type", "agent_type", "started_at"),
    )

class AgentOperation(Base):
    """Individual agent operation model"""
    __tablename__ = "agent_operations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False)
    operation_id = Column(String(100), nullable=False, index=True)
    operation_type = Column(String(100), nullable=False)  # e.g., "llm_call", "tool_execution", "memory_access"
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, failed
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    cost = Column(Float, default=0.0, nullable=False)
    latency_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True, default=dict)
    
    # Relationships
    session = relationship("AgentSession", back_populates="operations")
    
    __table_args__ = (
        Index("idx_operations_session_status", "session_id", "status"),
        Index("idx_operations_type_started", "operation_type", "started_at"),
    )

class CostAggregation(Base):
    """Materialized view for cost aggregation"""
    __tablename__ = "cost_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    aggregation_date = Column(DateTime, nullable=False, index=True)
    period = Column(String(20), nullable=False)  # hourly, daily, weekly, monthly
    total_cost = Column(Float, default=0.0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    session_count = Column(Integer, default=0, nullable=False)
    operation_count = Column(Integer, default=0, nullable=False)
    
    __table_args__ = (
        Index("idx_cost_agg_tenant_date", "tenant_id", "aggregation_date"),
        Index("idx_cost_agg_project_period", "project_id", "period", "aggregation_date", unique=True),
    )

# Dependency to get database session
async def get_postgres_session() -> AsyncSession:
    """
    Dependency to get PostgreSQL database session
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()