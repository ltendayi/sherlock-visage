# Sherlock Visage - Agent Telemetry API

Real-time WebSocket and REST API for monitoring AI agents and task management.

## Quick Start

```bash
# Start the server
python agent_telemetry.py

# Or with custom options
python start_telemetry.py --port 8080 --reload

# Test the API
python test_telemetry.py --ws-duration 20
```

## WebSocket Endpoint

### Connect
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/agents');
```

### Incoming Messages (Server → Client)

| Type | Description | Data |
|------|-------------|------|
| `connected` | Initial connection acknowledgment | `{ message, timestamp }` |
| `system_status` | Overall system metrics (broadcast every 2s) | SystemStatusResponse |
| `agent_update` | Individual agent status change | Agent |
| `task_update` | Task progress/status change | Task |
| `heartbeat` | Keep-alive ping (every 30s) | `{ timestamp }` |

### Outgoing Messages (Client → Server)

| Type | Purpose |
|------|---------|
| `ping` | Respond to heartbeat |
| `get_status` | Request immediate status refresh |
| `subscribe_agent` | Request specific agent updates |

### Example JavaScript Client
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/agents');

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    switch(msg.type) {
        case 'agent_update':
            console.log(`Agent ${msg.data.id}: ${msg.data.status}`);
            updateAgentUI(msg.data);
            break;
        case 'system_status':
            updateDashboard(msg.data);
            break;
        case 'task_update':
            updateTaskProgress(msg.data);
            break;
    }
};
```

## REST Endpoints

### System Information

#### `GET /`
Health check and API info.

#### `GET /api/agents/status`
Get system-wide status summary.

**Response:**
```json
{
  "total_agents": 10,
  "online_agents": 3,
  "busy_agents": 4,
  "idle_agents": 3,
  "offline_agents": 0,
  "total_tasks_completed": 42,
  "total_tasks_failed": 2,
  "total_cost_usd": 12.3456,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Agent Management

#### `GET /api/agents`
List all registered agents.

#### `GET /api/agents/{agent_id}/details`
Get detailed agent information including task queue.

**Example:** `GET /api/agents/sherlock_3d/details`

**Response:**
```json
{
  "agent": {
    "id": "sherlock_3d",
    "name": "3D Specialist",
    "model": "gpt-4.1",
    "role": "sherlock",
    "status": "busy",
    "current_task": "abc123",
    "task_queue": ["abc123", "def456"],
    "completed_tasks": 15,
    "failed_tasks": 1,
    "total_cost": 2.50,
    "uptime_seconds": 3600
  },
  "tasks": [...],
  "queue_position": 0
}
```

#### `GET /api/agents/{agent_id}/tasks`
Get all tasks for a specific agent.

#### `POST /api/agents/{agent_id}/status`
Manually update agent status.

**Body:** `{ "status": "idle" | "busy" | "online" | "offline" }`

### Task Management

#### `POST /api/agents/{agent_id}/task`
Create a new task for an agent.

**Request:**
```json
{
  "name": "Render Dashboard",
  "description": "Create 3D dashboard visualization",
  "metadata": { "priority": "high" }
}
```

**Response:**
```json
{
  "task": {
    "id": "a1b2c3d4",
    "agent_id": "sherlock_3d",
    "name": "Render Dashboard",
    "status": "pending",
    "progress": 0.0,
    "created_at": "2024-01-15T10:30:00"
  },
  "message": "Task created and queued for agent sherlock_3d"
}
```

#### `GET /api/tasks/{task_id}`
Get task details.

#### `POST /api/tasks/{task_id}/progress`
Update task progress (0-100).

**Query:** `?progress=50`

## Agent Registry

All 10 agents are pre-registered:

| ID | Model | Role | Rate/hr |
|----|-------|------|---------|
| sherlock_3d | gpt-4.1 | 3D Specialist | $2.50 |
| sherlock_ux | gpt-4.1 | UI/UX Lead | $2.50 |
| sherlock_backend | deepseek-v3.2 | Backend API | $0.14 |
| volt_frontend | gpt-4.1 | VoltLedger Frontend | $2.50 |
| volt_backend | deepseek-v3.2 | VoltLedger API | $0.14 |
| volt_fintech | gpt-4.1-mini | M-Pesa Integration | $0.40 |
| volt_devops | gpt-4.1-mini | CI/CD | $0.40 |
| volt_data_arch | deepseek-v3.2 | Data Architecture | $0.14 |
| volt_automation | gpt-4.1-mini | SMS/Automation | $0.40 |
| volt_bi | gpt-4.1 | Business Intelligence | $2.50 |

## Status Enum

- `online` - Agent is connected and ready
- `idle` - Agent waiting for tasks
- `busy` - Agent actively processing
- `offline` - Agent not connected

## Task Status Enum

- `pending` - Queued waiting to start
- `running` - Actively executing
- `completed` - Finished successfully
- `failed` - Execution error
- `cancelled` - Manually cancelled

## Architecture

```
┌─────────────────┐
│  WebSocket      │◄── Real-time streaming to dashboard
│  /ws/agents     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Connection     │◄── Manages client connections
│  Manager        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Agent Registry │◄── In-memory data store
│  (thread-safe)  │    • Cost tracking
└────────┬────────┘    • Status transitions
         │              • Task queue
┌────────▼────────┐
│  REST Endpoints │◄── HTTP API for management
│  /api/*         │
└─────────────────┘
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | 0.0.0.0 | Server bind address |
| `PORT` | 8000 | Server port |

## Docker

```bash
# Build
docker build -t sherlock-telemetry .

# Run
docker run -p 8000:8000 sherlock-telemetry
```
