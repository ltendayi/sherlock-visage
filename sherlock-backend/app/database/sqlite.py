"""
SQLite database configuration and models for Hermes agent operations
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

# Create async engine for SQLite
engine = create_async_engine(
    f"sqlite+aiosqlite:///{settings.SQLITE_PATH}",
    echo=settings.ENVIRONMENT == "development",
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for SQLite models
Base = declarative_base()

class HermesSession(Base):
    """Hermes agent session model from SQLite database"""
    __tablename__ = "sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    channel_id = Column(String(100), nullable=True, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="active", nullable=False)  # active, completed, archived
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    metadata = Column(JSON, nullable=True, default=dict)
    
    # Relationships
    messages = relationship("HermesMessage", back_populates="session", cascade="all, delete-orphan")

class HermesMessage(Base):
    """Hermes message model from SQLite database"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(String(100), nullable=False, unique=True, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system, tool
    content = Column(Text, nullable=True)
    tool_calls = Column(JSON, nullable=True)
    tool_call_id = Column(String(100), nullable=True)
    name = Column(String(100), nullable=True)
    input_tokens = Column(Integer, default=0, nullable=False)
    output_tokens = Column(Integer, default=0, nullable=False)
    cost = Column(Float, default=0.0, nullable=False)
    model = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    session = relationship("HermesSession", back_populates="messages")
    
    __table_args__ = (
        Index("idx_messages_session_created", "session_id", "created_at"),
        Index("idx_messages_role_session", "role", "session_id"),
    )

class HermesToolExecution(Base):
    """Hermes tool execution model from SQLite database"""
    __tablename__ = "tool_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    tool_call_id = Column(String(100), nullable=False, index=True)
    tool_name = Column(String(100), nullable=False, index=True)
    arguments = Column(JSON, nullable=True)
    result = Column(Text, nullable=True)
    status = Column(String(50), default="completed", nullable=False)  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index("idx_tool_executions_session_tool", "session_id", "tool_name"),
        Index("idx_tool_executions_tool_call", "tool_call_id", unique=True),
    )

class HermesMemory(Base):
    """Hermes memory model from SQLite database"""
    __tablename__ = "memories"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), nullable=False, index=True)
    value = Column(JSON, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index("idx_memories_key", "key", unique=True),
        Index("idx_memories_expires", "expires_at"),
    )

class HermesSkill(Base):
    """Hermes skill model from SQLite database"""
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)
    last_used = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    metadata = Column(JSON, nullable=True, default=dict)
    
    __table_args__ = (
        Index("idx_skills_category_enabled", "category", "is_enabled"),
    )

class HermesCostAggregation(Base):
    """Materialized view for Hermes cost aggregation"""
    __tablename__ = "cost_aggregations"
    
    id = Column(Integer, primary_key=True, index=True)
    aggregation_date = Column(DateTime, nullable=False, index=True)
    period = Column(String(20), nullable=False)  # hourly, daily, weekly, monthly
    total_cost = Column(Float, default=0.0, nullable=False)
    total_tokens = Column(Integer, default=0, nullable=False)
    message_count = Column(Integer, default=0, nullable=False)
    session_count = Column(Integer, default=0, nullable=False)
    avg_cost_per_session = Column(Float, default=0.0, nullable=False)
    avg_tokens_per_message = Column(Float, default=0.0, nullable=False)
    
    __table_args__ = (
        Index("idx_hermes_cost_agg_date_period", "aggregation_date", "period", unique=True),
    )

# Dependency to get SQLite database session
async def get_sqlite_session() -> AsyncSession:
    """
    Dependency to get SQLite database session
    
    Yields:
        AsyncSession: Database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()