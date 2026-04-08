"""
Dashboard data schemas for Sherlock Visage
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class TimeRange(BaseModel):
    """Time range for data aggregation"""
    start_date: datetime
    end_date: datetime
    
    @validator("end_date")
    def validate_date_range(cls, v, values):
        """Validate that end_date is after start_date"""
        if "start_date" in values and v <= values["start_date"]:
            raise ValueError("end_date must be after start_date")
        return v


class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_sessions: int = 0
    active_sessions: int = 0
    total_cost: float = 0.0
    total_tokens: int = 0
    avg_cost_per_session: float = 0.0
    avg_tokens_per_session: int = 0
    session_success_rate: float = 0.0


class CostTrendData(BaseModel):
    """Cost trend data point"""
    timestamp: datetime
    total_cost: float
    session_count: int
    avg_cost_per_session: float


class TokenEfficiencyData(BaseModel):
    """Token efficiency data point"""
    timestamp: datetime
    total_tokens: int
    total_cost: float
    cost_per_token: float
    avg_tokens_per_session: int


class ProjectOverview(BaseModel):
    """Project overview data"""
    project_id: int
    project_name: str
    total_sessions: int
    active_sessions: int
    total_cost: float
    total_tokens: int
    last_activity: Optional[datetime] = None
    success_rate: float = 0.0


class AgentSessionSummary(BaseModel):
    """Agent session summary"""
    session_id: str
    agent_type: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    total_cost: float
    total_tokens: int
    project_name: Optional[str] = None
    error_count: int = 0
    operation_count: int = 0


class OperationMetrics(BaseModel):
    """Operation-level metrics"""
    operation_type: str
    total_count: int
    success_count: int
    failure_count: int
    avg_latency_ms: float
    total_cost: float
    total_tokens: int


class SkillUsage(BaseModel):
    """Skill usage statistics"""
    skill_name: str
    category: str
    usage_count: int
    last_used: Optional[datetime] = None
    avg_cost: float = 0.0
    avg_tokens: int = 0


class HermesSessionDetail(BaseModel):
    """Detailed Hermes session data"""
    session_id: str
    channel_id: Optional[str] = None
    user_id: Optional[str] = None
    status: str
    message_count: int
    total_cost: float
    total_tokens: int
    created_at: datetime
    updated_at: datetime
    last_message_time: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HermesMessageDetail(BaseModel):
    """Detailed Hermes message data"""
    message_id: str
    role: str
    content: Optional[str] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    input_tokens: int
    output_tokens: int
    cost: float
    model: Optional[str] = None
    created_at: datetime


class RealTimeUpdate(BaseModel):
    """Real-time update for WebSocket"""
    event_type: str  # session_created, session_updated, message_created, cost_updated
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AggregationRequest(BaseModel):
    """Request for data aggregation"""
    time_range: TimeRange
    aggregation_level: str = Field("daily", regex="^(hourly|daily|weekly|monthly)$")
    project_ids: Optional[List[int]] = None
    agent_types: Optional[List[str]] = None


class CostBreakdown(BaseModel):
    """Cost breakdown by category"""
    category: str
    total_cost: float
    percentage: float
    item_count: int


class EfficiencyMetrics(BaseModel):
    """Efficiency metrics"""
    tokens_per_dollar: float
    cost_per_token: float
    avg_session_duration_ms: Optional[float] = None
    success_rate: float
    error_rate: float


class DashboardResponse(BaseModel):
    """Complete dashboard response"""
    stats: DashboardStats
    cost_trend: List[CostTrendData]
    token_efficiency: List[TokenEfficiencyData]
    project_overviews: List[ProjectOverview]
    recent_sessions: List[AgentSessionSummary]
    operation_metrics: List[OperationMetrics]
    skill_usage: List[SkillUsage]
    cost_breakdown: List[CostBreakdown]
    efficiency_metrics: EfficiencyMetrics