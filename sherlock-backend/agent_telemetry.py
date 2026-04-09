"""
Sherlock Visage - Real-time Agent Telemetry WebSocket System
Provides live agent status streaming, cost tracking, and task management
"""

import asyncio
import json
import time
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# VoltLedger Bridge integration
try:
    from voltledger_client import (
        VoltLedgerClient, VoltLedgerConfig, VoltLedgerMetrics,
        ConnectionStatus, initialize_voltledger_client
    )
    VOLTLEDGER_AVAILABLE = True
except ImportError:
    VOLTLEDGER_AVAILABLE = False


# ============================================================================
# Enums and Constants
# ============================================================================

class AgentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    IDLE = "idle"


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Model pricing per hour (USD)
MODEL_PRICING = {
    "gpt-4.1": 2.50,
    "deepseek-v3.2": 0.14,
    "gpt-4.1-mini": 0.40,
}

# Agent registry configuration
AGENT_REGISTRY_CONFIG = [
    {"id": "sherlock_3d", "model": "gpt-4.1", "name": "3D Specialist", "role": "sherlock"},
    {"id": "sherlock_ux", "model": "gpt-4.1", "name": "UI/UX Lead", "role": "sherlock"},
    {"id": "sherlock_backend", "model": "deepseek-v3.2", "name": "Backend API", "role": "sherlock"},
    {"id": "volt_frontend", "model": "gpt-4.1", "name": "VoltLedger Frontend", "role": "volt"},
    {"id": "volt_backend", "model": "deepseek-v3.2", "name": "VoltLedger API", "role": "volt"},
    {"id": "volt_fintech", "model": "gpt-4.1-mini", "name": "M-Pesa Integration", "role": "volt"},
    {"id": "volt_devops", "model": "gpt-4.1-mini", "name": "CI/CD", "role": "volt"},
    {"id": "volt_data_arch", "model": "deepseek-v3.2", "name": "Data Architecture", "role": "volt"},
    {"id": "volt_automation", "model": "gpt-4.1-mini", "name": "SMS/Automation", "role": "volt"},
    {"id": "volt_bi", "model": "gpt-4.1", "name": "Business Intelligence", "role": "volt"},
]


# ============================================================================
# Pydantic Models
# ============================================================================

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    agent_id: str
    name: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    progress: float = 0.0  # 0.0 to 100.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Dict = Field(default_factory=dict)


class Agent(BaseModel):
    id: str
    name: str
    model: str
    role: str
    status: AgentStatus = AgentStatus.OFFLINE
    current_task: Optional[str] = None
    task_queue: List[str] = Field(default_factory=list)
    completed_tasks: int = 0
    failed_tasks: int = 0
    total_cost: float = 0.0  # USD
    session_start: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    uptime_seconds: float = 0.0
    metadata: Dict = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True


class AgentStatusUpdate(BaseModel):
    agent_id: str
    status: AgentStatus
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TaskRequest(BaseModel):
    name: str
    description: Optional[str] = None
    metadata: Optional[Dict] = None


class TaskResponse(BaseModel):
    task: Task
    message: str


class AgentDetailsResponse(BaseModel):
    agent: Agent
    tasks: List[Task]
    queue_position: Optional[int] = None

class SystemStatusResponse(BaseModel):
    """Overall system status response"""
    total_agents: int
    online_agents: int
    busy_agents: int
    idle_agents: int
    offline_agents: int
    total_tasks_completed: int
    total_tasks_failed: int
    total_cost_usd: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# VoltLedger Bridge Models
# ============================================================================

class VoltLedgerStatusResponse(BaseModel):
    """VoltLedger bridge connection status"""
    connected: bool
    status: str
    last_sync: Optional[str] = None
    sync_count: int = 0
    base_url: str = "http://localhost:5000"
    polling_interval: int = 30
    message: str = ""


class VoltLedgerTaskItem(BaseModel):
    """Mapped VoltLedger loan as task item for dashboard"""
    id: str
    type: str = "voltledger_loan"
    title: str
    description: str
    status: str
    progress: float
    created_at: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class VoltLedgerAgentWorkload(BaseModel):
    """VoltLedger bike as agent workload indicator"""
    bike_id: str
    model: str
    status: str
    assigned_agent: Optional[str] = None
    battery_health: float = 100.0
    mileage: float = 0.0
    maintenance_required: bool = False
    location: Optional[str] = None


class VoltLedgerMetricsResponse(BaseModel):
    """VoltLedger aggregated metrics response"""
    connection_status: str
    last_sync: Optional[str] = None
    
    # Loan metrics
    total_loans: int = 0
    active_loans: int = 0
    pending_loans: int = 0
    completed_loans: int = 0
    defaulted_loans: int = 0
    default_rate: float = 0.0
    
    # Financial metrics
    total_amount: float = 0.0
    total_repaid: float = 0.0
    
    # Bike metrics
    bikes_available: int = 0
    bikes_assigned: int = 0
    bikes_maintenance: int = 0
    total_bikes: int = 0
    
    # Agent efficiency metrics
    processing_rate: float = 0.0  # loans per hour
    agent_efficiency_score: float = 0.0  # 0-100
    agent_workload_indicator: float = 0.0  # 0-100
    avg_loan_duration_days: float = 0.0
    
    # Dashboard integration
    tasks: List[VoltLedgerTaskItem] = Field(default_factory=list)
    workloads: List[VoltLedgerAgentWorkload] = Field(default_factory=list)


class VoltLedgerSyncResponse(BaseModel):
    """VoltLedger manual sync response"""
    success: bool
    message: str
    sync_timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    data_freshness: str = "fresh"


# ============================================================================
# VoltLedger Bridge Integration
# ============================================================================

class VoltLedgerBridge:
    """VoltLedger bridge integration handler"""
    
    def __init__(self):
        self.client: Optional[VoltLedgerClient] = None
        self._initialized = False
        self._last_metrics: Optional[VoltLedgerMetrics] = None
    
    async def initialize(self):
        """Initialize VoltLedger client"""
        if not VOLTLEDGER_AVAILABLE:
            return
        
        try:
            config = VoltLedgerConfig(
                base_url="http://localhost:5000",
                polling_interval=30,
                cache_ttl=30
            )
            self.client = VoltLedgerClient(config)
            await self.client.initialize()
            
            # Register callback for metrics updates
            self.client.on_update(self._on_metrics_update)
            
            # Start background polling
            await self.client.start_polling()
            
            self._initialized = True
        except Exception as e:
            print(f"VoltLedger bridge initialization failed: {e}")
    
    def _on_metrics_update(self, metrics: VoltLedgerMetrics):
        """Handle metrics updates from VoltLedger client"""
        self._last_metrics = metrics
    
    async def shutdown(self):
        """Cleanup VoltLedger client"""
        if self.client:
            await self.client.close()
            self.client = None
        self._initialized = False
    
    async def sync(self) -> bool:
        """Trigger manual sync"""
        if self.client:
            await self.client.sync()
            return True
        return False
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized and self.client is not None
    
    @property
    def is_connected(self) -> bool:
        if self.client:
            return self.client.is_connected
        return False
    
    @property
    def metrics(self) -> Optional[VoltLedgerMetrics]:
        if self.client:
            return self.client.metrics
        return self._last_metrics
    
    @property
    def sync_count(self) -> int:
        if self.client:
            return self.client.sync_count
        return 0
    
    @property
    def last_sync(self) -> Optional[datetime]:
        if self.client:
            return self.client.last_sync
        return None


# Global VoltLedger bridge instance
voltledger_bridge = VoltLedgerBridge()


# ============================================================================
# In-Memory Data Stores
# ============================================================================

class AgentRegistry:
    """Thread-safe in-memory agent registry with cost tracking"""
    
    def __init__(self):
        self._agents: Dict[str, Agent] = {}
        self._tasks: Dict[str, Task] = {}
        self._lock = asyncio.Lock()
        self._cost_tracking_task: Optional[asyncio.Task] = None
        self._status_simulation_task: Optional[asyncio.Task] = None
    
    async def initialize(self):
        """Initialize registry with default agents"""
        async with self._lock:
            for config in AGENT_REGISTRY_CONFIG:
                agent = Agent(
                    id=config["id"],
                    name=config["name"],
                    model=config["model"],
                    role=config["role"],
                    status=AgentStatus.IDLE,
                    session_start=datetime.utcnow(),
                    last_activity=datetime.utcnow(),
                )
                self._agents[agent.id] = agent
        
        # Initialize VoltLedger bridge
        await voltledger_bridge.initialize()
        
        # Start background tasks
        self._cost_tracking_task = asyncio.create_task(self._cost_tracker())
        self._status_simulation_task = asyncio.create_task(self._status_simulator())
    
    async def shutdown(self):
        """Cleanup background tasks"""
        # Shutdown VoltLedger bridge
        await voltledger_bridge.shutdown()
        
        if self._cost_tracking_task:
            self._cost_tracking_task.cancel()
        if self._status_simulation_task:
            self._status_simulation_task.cancel()
    
    async def _cost_tracker(self):
        """Background task: Update costs every second based on agent status"""
        try:
            while True:
                await asyncio.sleep(1)
                async with self._lock:
                    now = datetime.utcnow()
                    for agent in self._agents.values():
                        if agent.status in [AgentStatus.ONLINE, AgentStatus.BUSY]:
                            # Calculate cost per second
                            hourly_rate = MODEL_PRICING.get(agent.model, 0.0)
                            cost_per_second = hourly_rate / 3600
                            agent.total_cost += cost_per_second
                            agent.uptime_seconds += 1
                            agent.last_activity = now
        except asyncio.CancelledError:
            pass
    
    async def _status_simulator(self):
        """Background task: Simulate realistic agent status transitions"""
        try:
            while True:
                await asyncio.sleep(5)  # Check every 5 seconds
                async with self._lock:
                    for agent in self._agents.values():
                        # Auto-transition logic
                        if agent.status == AgentStatus.BUSY and not agent.current_task:
                            # If busy but no task, become idle
                            agent.status = AgentStatus.IDLE
                        elif agent.status == AgentStatus.IDLE and agent.task_queue:
                            # If idle with tasks, start processing
                            agent.status = AgentStatus.BUSY
        except asyncio.CancelledError:
            pass
    
    # Agent Methods
    
    async def get_all_agents(self) -> List[Agent]:
        """Get all registered agents"""
        async with self._lock:
            return list(self._agents.values())
    
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get specific agent by ID"""
        async with self._lock:
            return self._agents.get(agent_id)
    
    async def update_agent_status(self, agent_id: str, status: AgentStatus) -> Optional[Agent]:
        """Update agent status"""
        async with self._lock:
            if agent_id in self._agents:
                self._agents[agent_id].status = status
                self._agents[agent_id].last_activity = datetime.utcnow()
                return self._agents[agent_id]
            return None
    
    async def get_agent_tasks(self, agent_id: str) -> List[Task]:
        """Get all tasks for an agent"""
        async with self._lock:
            return [t for t in self._tasks.values() if t.agent_id == agent_id]
    
    # Task Methods
    
    async def create_task(self, agent_id: str, request: TaskRequest) -> Task:
        """Create a new task for an agent"""
        async with self._lock:
            if agent_id not in self._agents:
                raise ValueError(f"Agent {agent_id} not found")
            
            task = Task(
                agent_id=agent_id,
                name=request.name,
                description=request.description,
                metadata=request.metadata or {},
            )
            self._tasks[task.id] = task
            self._agents[agent_id].task_queue.append(task.id)
            
            # If agent is idle, mark as busy
            if self._agents[agent_id].status == AgentStatus.IDLE:
                self._agents[agent_id].status = AgentStatus.BUSY
            
            return task
    
    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get specific task"""
        async with self._lock:
            return self._tasks.get(task_id)
    
    async def update_task_progress(self, task_id: str, progress: float) -> Optional[Task]:
        """Update task progress (0-100)"""
        async with self._lock:
            if task_id not in self._tasks:
                return None
            
            task = self._tasks[task_id]
            task.progress = max(0.0, min(100.0, progress))
            
            if task.progress >= 100.0 and task.status == TaskStatus.RUNNING:
                task.status = TaskStatus.COMPLETED
                task.completed_at = datetime.utcnow()
                await self._complete_task(task)
            
            return task
    
    async def start_task(self, task_id: str) -> Optional[Task]:
        """Mark task as running"""
        async with self._lock:
            if task_id not in self._tasks:
                return None
            
            task = self._tasks[task_id]
            task.status = TaskStatus.RUNNING
            task.started_at = datetime.utcnow()
            
            agent = self._agents.get(task.agent_id)
            if agent:
                agent.current_task = task_id
                agent.status = AgentStatus.BUSY
            
            # Start simulated progress
            asyncio.create_task(self._simulate_task_progress(task_id))
            
            return task
    
    async def _simulate_task_progress(self, task_id: str):
        """Simulate task progress automatically"""
        try:
            progress = 0.0
            while progress < 100.0:
                await asyncio.sleep(2)  # Update every 2 seconds
                progress += 20.0  # 20% increments
                await self.update_task_progress(task_id, progress)
        except Exception:
            pass
    
    async def _complete_task(self, task: Task):
        """Handle task completion"""
        agent = self._agents.get(task.agent_id)
        if agent:
            agent.completed_tasks += 1
            agent.current_task = None
            if task.id in agent.task_queue:
                agent.task_queue.remove(task.id)
            
            # Check if more tasks in queue
            if agent.task_queue:
                next_task_id = agent.task_queue[0]
                asyncio.create_task(self.start_task(next_task_id))
            else:
                agent.status = AgentStatus.IDLE
    
    async def fail_task(self, task_id: str, error_message: str) -> Optional[Task]:
        """Mark task as failed"""
        async with self._lock:
            if task_id not in self._tasks:
                return None
            
            task = self._tasks[task_id]
            task.status = TaskStatus.FAILED
            task.error_message = error_message
            task.completed_at = datetime.utcnow()
            
            agent = self._agents.get(task.agent_id)
            if agent:
                agent.failed_tasks += 1
                agent.current_task = None
                if task.id in agent.task_queue:
                    agent.task_queue.remove(task.id)
            
            return task
    
    # System Stats
    
    async def get_system_status(self) -> SystemStatusResponse:
        """Get overall system status"""
        async with self._lock:
            agents = list(self._agents.values())
            return SystemStatusResponse(
                total_agents=len(agents),
                online_agents=sum(1 for a in agents if a.status == AgentStatus.ONLINE),
                busy_agents=sum(1 for a in agents if a.status == AgentStatus.BUSY),
                idle_agents=sum(1 for a in agents if a.status == AgentStatus.IDLE),
                offline_agents=sum(1 for a in agents if a.status == AgentStatus.OFFLINE),
                total_tasks_completed=sum(a.completed_tasks for a in agents),
                total_tasks_failed=sum(a.failed_tasks for a in agents),
                total_cost_usd=sum(a.total_cost for a in agents),
            )


# Global registry instance
registry = AgentRegistry()


# ============================================================================
# WebSocket Connection Manager
# ============================================================================

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        """Accept and register new WebSocket connection"""
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        async with self._lock:
            self._connections.discard(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        async with self._lock:
            connections = list(self._connections)
        
        for conn in connections:
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.append(conn)
        
        # Clean up disconnected clients
        if disconnected:
            async with self._lock:
                for conn in disconnected:
                    self._connections.discard(conn)
    
    async def broadcast_agent_update(self, agent: Agent):
        """Broadcast agent status update"""
        await self.broadcast({
            "type": "agent_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": agent.model_dump(),
        })
    
    async def broadcast_task_update(self, task: Task):
        """Broadcast task update"""
        await self.broadcast({
            "type": "task_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": task.model_dump(),
        })
    
    async def broadcast_system_status(self, status: SystemStatusResponse):
        """Broadcast system status"""
        await self.broadcast({
            "type": "system_status",
            "timestamp": datetime.utcnow().isoformat(),
            "data": status.model_dump(),
        })
    
    async def broadcast_voltledger_update(self, metrics: Any):
        """Broadcast VoltLedger metrics update to all clients"""
        from voltledger_client import VoltLedgerMetrics
        
        if isinstance(metrics, VoltLedgerMetrics):
            data = {
                "connection_status": metrics.connection_status.value,
                "last_sync": metrics.last_sync.isoformat() if metrics.last_sync else None,
                "total_loans": metrics.summary.total_loans if metrics.summary else 0,
                "active_loans": metrics.summary.active_loans if metrics.summary else 0,
                "pending_loans": metrics.summary.pending_loans if metrics.summary else 0,
                "completed_loans": metrics.summary.completed_loans if metrics.summary else 0,
                "default_rate": metrics.summary.default_rate if metrics.summary else 0.0,
                "bikes_available": metrics.bikes_available,
                "bikes_assigned": metrics.bikes_assigned,
                "bikes_maintenance": metrics.bikes_maintenance,
                "processing_rate": metrics.processing_rate,
                "agent_efficiency_score": metrics.agent_efficiency_score,
                "agent_workload_indicator": metrics.agent_workload_indicator,
            }
        else:
            data = metrics if isinstance(metrics, dict) else {}
        
        await self.broadcast({
            "type": "voltledger_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
        })


# Global connection manager
manager = ConnectionManager()


# ============================================================================
# Background Broadcasting Task
# ============================================================================

async def broadcast_loop():
    """Periodically broadcast system updates to all connected clients"""
    try:
        while True:
            await asyncio.sleep(2)  # Broadcast every 2 seconds
            status = await registry.get_system_status()
            await manager.broadcast_system_status(status)
            
            # Also broadcast all agent updates
            agents = await registry.get_all_agents()
            for agent in agents:
                await manager.broadcast_agent_update(agent)
            
            # Broadcast VoltLedger updates if available
            if VOLTLEDGER_AVAILABLE and voltledger_bridge.is_initialized:
                metrics = voltledger_bridge.metrics
                if metrics:
                    await manager.broadcast_voltledger_update(metrics)
    except asyncio.CancelledError:
        pass


# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await registry.initialize()
    broadcast_task = asyncio.create_task(broadcast_loop())
    yield
    # Shutdown
    broadcast_task.cancel()
    await registry.shutdown()


app = FastAPI(
    title="Sherlock Visage - Agent Telemetry API",
    description="Real-time agent monitoring and task management WebSocket system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REST Endpoints
# ============================================================================

@app.get("/")
async def root():
    """API root - health check"""
    return {
        "service": "Sherlock Visage Agent Telemetry",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "websocket": "/ws/agents",
            "agents_status": "/api/agents/status",
            "agent_details": "/api/agents/{agent_id}/details",
            "create_task": "POST /api/agents/{agent_id}/task",
        }
    }


@app.get("/api/agents/status", response_model=SystemStatusResponse)
async def get_agents_status():
    """Get current status of all agents and system overview"""
    return await registry.get_system_status()


@app.get("/api/agents")
async def list_agents():
    """List all agents with their current status"""
    agents = await registry.get_all_agents()
    return {
        "agents": [agent.model_dump() for agent in agents],
        "count": len(agents),
    }


@app.get("/api/agents/{agent_id}/details", response_model=AgentDetailsResponse)
async def get_agent_details(agent_id: str):
    """Get detailed information about a specific agent including tasks"""
    agent = await registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    tasks = await registry.get_agent_tasks(agent_id)
    
    # Calculate queue position for current task
    queue_position = None
    if agent.current_task and agent.task_queue:
        try:
            queue_position = agent.task_queue.index(agent.current_task)
        except ValueError:
            pass
    
    return AgentDetailsResponse(
        agent=agent,
        tasks=tasks,
        queue_position=queue_position,
    )


@app.post("/api/agents/{agent_id}/task", response_model=TaskResponse)
async def create_agent_task(agent_id: str, request: TaskRequest):
    """Create a new task for an agent"""
    agent = await registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    try:
        task = await registry.create_task(agent_id, request)
        
        # Broadcast updates
        await manager.broadcast_task_update(task)
        await manager.broadcast_agent_update(agent)
        
        # Auto-start if agent is idle
        if agent.status == AgentStatus.IDLE or not agent.current_task:
            await registry.start_task(task.id)
        
        return TaskResponse(
            task=task,
            message=f"Task created and queued for agent {agent_id}",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/agents/{agent_id}/tasks")
async def get_agent_tasks(agent_id: str):
    """Get all tasks for a specific agent"""
    agent = await registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    tasks = await registry.get_agent_tasks(agent_id)
    return {
        "agent_id": agent_id,
        "tasks": [task.model_dump() for task in tasks],
        "queue": agent.task_queue,
    }


@app.post("/api/agents/{agent_id}/status")
async def update_agent_status_endpoint(agent_id: str, status: AgentStatus):
    """Manually update agent status"""
    agent = await registry.update_agent_status(agent_id, status)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")
    
    await manager.broadcast_agent_update(agent)
    return {"message": f"Agent {agent_id} status updated to {status}", "agent": agent.model_dump()}


@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """Get task details"""
    task = await registry.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task.model_dump()


@app.post("/api/tasks/{task_id}/progress")
async def update_task_progress_endpoint(task_id: str, progress: float):
    """Update task progress"""
    task = await registry.update_task_progress(task_id, progress)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    await manager.broadcast_task_update(task)
    return {"message": "Task progress updated", "task": task.model_dump()}


# ============================================================================
# VoltLedger Bridge Endpoints
# ============================================================================

def _map_loan_to_task(loan_dict: Dict) -> VoltLedgerTaskItem:
    """Map VoltLedger loan to dashboard task item"""
    status_mapping = {
        "pending": "pending",
        "approved": "running",
        "active": "running",
        "completed": "completed",
        "defaulted": "failed",
        "rejected": "cancelled",
    }
    
    status = loan_dict.get("status", "pending")
    progress = loan_dict.get("progress", 0.0)
    
    # Determine priority based on status and amount
    amount = loan_dict.get("amount", 0)
    if status == "defaulted":
        priority = "high"
    elif amount > 5000:
        priority = "high"
    elif amount > 2000:
        priority = "medium"
    else:
        priority = "low"
    
    created_at = loan_dict.get("created_at")
    created_str = None
    if created_at:
        if isinstance(created_at, datetime):
            created_str = created_at.isoformat()
        else:
            created_str = str(created_at)
    
    # Create descriptive title and description
    bike_model = loan_dict.get("metadata", {}).get("bike_model", "Unknown Bike")
    customer_name = loan_dict.get("metadata", {}).get("customer_name", "Customer")
    
    title = f"Loan: {customer_name} - ${amount:,.0f}"
    description = f"{bike_model} | Progress: {progress:.1f}% | Status: {status}"
    
    return VoltLedgerTaskItem(
        id=loan_dict.get("id", "unknown"),
        type="voltledger_loan",
        title=title,
        description=description,
        status=status_mapping.get(status, status),
        progress=progress,
        created_at=created_str,
        priority=priority,
        assigned_to=loan_dict.get("assigned_loan_id"),
        metadata={
            "amount": amount,
            "bike_id": loan_dict.get("bike_id"),
            "customer_id": loan_dict.get("customer_id"),
            "original_status": status,
        }
    )


def _map_bike_to_workload(bike_dict: Dict) -> VoltLedgerAgentWorkload:
    """Map VoltLedger bike to agent workload indicator"""
    status = bike_dict.get("status", "available")
    battery_health = bike_dict.get("battery_health", 100.0)
    
    maintenance_required = (
        status == "maintenance" or 
        battery_health < 50 or
        bike_dict.get("mileage", 0) > 1000
    )
    
    # Map bike to a representative agent based on status
    if status == "assigned":
        assigned_agent = "volt_fintech"
    elif status == "maintenance":
        assigned_agent = "volt_devops"
    else:
        assigned_agent = None
    
    return VoltLedgerAgentWorkload(
        bike_id=bike_dict.get("id", "unknown"),
        model=bike_dict.get("model", "Unknown"),
        status=status,
        assigned_agent=assigned_agent,
        battery_health=battery_health,
        mileage=bike_dict.get("mileage", 0.0),
        maintenance_required=maintenance_required,
        location=bike_dict.get("location"),
    )


@app.get("/api/voltledger/status", response_model=VoltLedgerStatusResponse)
async def get_voltledger_status():
    """Get VoltLedger bridge connection status"""
    if not VOLTLEDGER_AVAILABLE:
        return VoltLedgerStatusResponse(
            connected=False,
            status="unavailable",
            message="VoltLedger client module not available",
            polling_interval=30,
            base_url="http://localhost:5000",
        )
    
    last_sync = voltledger_bridge.last_sync
    last_sync_str = last_sync.isoformat() if last_sync else None
    
    status = "connected" if voltledger_bridge.is_connected else "disconnected"
    if voltledger_bridge.metrics and voltledger_bridge.metrics.connection_status:
        status = voltledger_bridge.metrics.connection_status.value
    
    return VoltLedgerStatusResponse(
        connected=voltledger_bridge.is_connected,
        status=status,
        last_sync=last_sync_str,
        sync_count=voltledger_bridge.sync_count,
        polling_interval=30,
        base_url="http://localhost:5000",
        message="VoltLedger bridge operational" if voltledger_bridge.is_initialized else "VoltLedger bridge not initialized",
    )


@app.get("/api/voltledger/metrics", response_model=VoltLedgerMetricsResponse)
async def get_voltledger_metrics():
    """Get aggregated VoltLedger metrics for dashboard"""
    if not VOLTLEDGER_AVAILABLE or not voltledger_bridge.is_initialized:
        raise HTTPException(
            status_code=503, 
            detail="VoltLedger bridge not available"
        )
    
    metrics = voltledger_bridge.metrics
    if not metrics:
        raise HTTPException(
            status_code=503,
            detail="No metrics available from VoltLedger"
        )
    
    # Map loans to tasks
    tasks = []
    if metrics.recent_loans:
        for loan in metrics.recent_loans[:20]:  # Limit to 20 most recent
            loan_dict = loan.model_dump() if hasattr(loan, 'model_dump') else loan.__dict__
            tasks.append(_map_loan_to_task(loan_dict))
    
    # Map bikes to workloads
    workloads = []
    if metrics.bikes:
        for bike in metrics.bikes:
            bike_dict = bike.model_dump() if hasattr(bike, 'model_dump') else bike.__dict__
            workloads.append(_map_bike_to_workload(bike_dict))
    
    last_sync_str = None
    if metrics.last_sync:
        last_sync_str = metrics.last_sync.isoformat() if isinstance(metrics.last_sync, datetime) else str(metrics.last_sync)
    
    # Build response
    response = VoltLedgerMetricsResponse(
        connection_status=metrics.connection_status.value,
        last_sync=last_sync_str,
        
        # Loan metrics
        total_loans=metrics.summary.total_loans if metrics.summary else 0,
        active_loans=metrics.summary.active_loans if metrics.summary else 0,
        pending_loans=metrics.summary.pending_loans if metrics.summary else 0,
        completed_loans=metrics.summary.completed_loans if metrics.summary else 0,
        defaulted_loans=metrics.summary.defaulted_loans if metrics.summary else 0,
        default_rate=metrics.summary.default_rate if metrics.summary else 0.0,
        
        # Financial metrics
        total_amount=metrics.summary.total_amount if metrics.summary else 0.0,
        total_repaid=metrics.summary.total_repaid if metrics.summary else 0.0,
        avg_loan_duration_days=metrics.summary.avg_loan_duration_days if metrics.summary else 0.0,
        
        # Bike metrics
        bikes_available=metrics.bikes_available,
        bikes_assigned=metrics.bikes_assigned,
        bikes_maintenance=metrics.bikes_maintenance,
        total_bikes=len(metrics.bikes),
        
        # Agent efficiency metrics
        processing_rate=metrics.processing_rate,
        agent_efficiency_score=metrics.agent_efficiency_score,
        agent_workload_indicator=metrics.agent_workload_indicator,
        
        # Dashboard integration
        tasks=tasks,
        workloads=workloads,
    )
    
    return response


@app.post("/api/voltledger/sync", response_model=VoltLedgerSyncResponse)
async def trigger_voltledger_sync():
    """Trigger manual sync with VoltLedger API"""
    if not VOLTLEDGER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="VoltLedger client module not available"
        )
    
    if not voltledger_bridge.is_initialized:
        raise HTTPException(
            status_code=503,
            detail="VoltLedger bridge not initialized"
        )
    
    success = await voltledger_bridge.sync()
    
    if success:
        # Broadcast update to all connected clients
        metrics = voltledger_bridge.metrics
        if metrics:
            await manager.broadcast_voltledger_update(metrics)
        
        return VoltLedgerSyncResponse(
            success=True,
            message="VoltLedger sync completed successfully",
            data_freshness="fresh"
        )
    else:
        return VoltLedgerSyncResponse(
            success=False,
            message="VoltLedger sync failed - check connection",
            data_freshness="stale"
        )


# ============================================================================
# WebSocket Endpoint
# ============================================================================

@app.websocket("/ws/agents")
async def websocket_agents(websocket: WebSocket):
    """
    WebSocket endpoint for real-time agent telemetry streaming.
    
    Messages sent to clients:
    - agent_update: Individual agent status changes
    - task_update: Task progress and status changes  
    - system_status: Overall system metrics (broadcast every 2s)
    
    Messages accepted from clients:
    - subscribe_agent: Subscribe to specific agent updates
    - get_status: Request immediate status refresh
    """
    await manager.connect(websocket)
    
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({
            "type": "connected",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Connected to Sherlock Visage Agent Telemetry",
        })
        
        # Send current system status
        status = await registry.get_system_status()
        await websocket.send_json({
            "type": "system_status",
            "timestamp": datetime.utcnow().isoformat(),
            "data": status.model_dump(),
        })
        
        # Send all current agent states
        agents = await registry.get_all_agents()
        for agent in agents:
            await websocket.send_json({
                "type": "agent_update",
                "timestamp": datetime.utcnow().isoformat(),
                "data": agent.model_dump(),
            })
        
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for client messages with timeout
                data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=30.0
                )
                
                # Handle client commands
                message_type = data.get("type")
                
                if message_type == "get_status":
                    # Send current status
                    status = await registry.get_system_status()
                    await websocket.send_json({
                        "type": "system_status",
                        "timestamp": datetime.utcnow().isoformat(),
                        "data": status.model_dump(),
                    })
                
                elif message_type == "subscribe_agent":
                    agent_id = data.get("agent_id")
                    agent = await registry.get_agent(agent_id)
                    if agent:
                        await websocket.send_json({
                            "type": "agent_update",
                            "timestamp": datetime.utcnow().isoformat(),
                            "data": agent.model_dump(),
                        })
                
                elif message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    })
                
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}",
                    })
                    
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                })
    
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception as e:
        await manager.disconnect(websocket)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "agent_telemetry:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
