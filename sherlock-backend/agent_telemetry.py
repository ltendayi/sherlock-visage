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
from typing import Dict, List, Optional, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn


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
        
        # Start background tasks
        self._cost_tracking_task = asyncio.create_task(self._cost_tracker())
        self._status_simulation_task = asyncio.create_task(self._status_simulator())
    
    async def shutdown(self):
        """Cleanup background tasks"""
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
