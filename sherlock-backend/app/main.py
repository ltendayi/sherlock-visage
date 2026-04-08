from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import psutil
import os
import json
import asyncio
from typing import Dict, Set, Optional

app = FastAPI(title="Sherlock Visage API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
DELEGATES = [
    {"id": 1, "name": "Strategic Architect", "status": "active", "model": "DeepSeek-R1", "cost_tier": 2.0},
    {"id": 2, "name": "Lead Developer", "status": "active", "model": "DeepSeek-V3.2", "cost_tier": 0.3},
    {"id": 3, "name": "Security Auditor", "status": "idle", "model": "GPT-4o", "cost_tier": 1.0},
    {"id": 4, "name": "Rapid Prototyper", "status": "active", "model": "grok-4-1-fast-non-reasoning", "cost_tier": 0.1},
    {"id": 5, "name": "Algorithm Specialist", "status": "idle", "model": "Kimi-K2.5", "cost_tier": 1.5},
    {"id": 6, "name": "Crisis Resolver", "status": "error", "model": "DeepSeek-R1", "cost_tier": 3.0},
    {"id": 7, "name": "Documentation Specialist", "status": "active", "model": "text-embedding-3-small", "cost_tier": 0.05},
]

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self._running = True

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"WebSocket connected: {client_id}")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"WebSocket disconnected: {client_id}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                print(f"Error broadcasting: {e}")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending to {client_id}: {e}")

manager = ConnectionManager()

@app.get("/")
async def root():
    return {
        "service": "Sherlock Visage API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/delegates")
async def get_delegates():
    return {
        "delegates": DELEGATES,
        "count": len(DELEGATES),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/metrics")
async def get_metrics():
    # Get system metrics
    disk = psutil.disk_usage('/')
    memory = psutil.virtual_memory()
    
    return {
        "system": {
            "health": 80,
            "disk_usage_percent": disk.percent,
            "disk_available_gb": disk.free / (1024**3),
            "memory_usage_percent": memory.percent,
            "uptime_seconds": int(psutil.boot_time())
        },
        "cost": {
            "monthly_current": 425,
            "monthly_budget_min": 280,
            "monthly_budget_max": 570,
            "token_efficiency": 72
        },
        "guards": {
            "delta_only": True,
            "tiered_memory": True,
            "cost_gatekeeping": True,
            "high_cost_alert": True,
            "compression_enabled": True
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/system/health")
async def get_health():
    return {"status": "healthy", "score": 80}

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, client_id: str = "anonymous"):
    await manager.connect(websocket, client_id)
    
    # Send initial connection confirmation
    await manager.send_personal_message({
        "type": "connected",
        "timestamp": datetime.now().isoformat(),
        "data": {
            "client_id": client_id,
            "message": "WebSocket connection established"
        }
    }, client_id)
    
    try:
        while manager._running:
            try:
                # Receive message from client
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Handle ping/pong
                if data == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "timestamp": datetime.now().isoformat()}))
                    continue
                
                # Try to parse JSON
                try:
                    message = json.loads(data)
                    msg_type = message.get("type", "unknown")
                    
                    # Handle subscribe requests
                    if msg_type == "subscribe":
                        await manager.send_personal_message({
                            "type": "subscribed",
                            "timestamp": datetime.now().isoformat(),
                            "data": {
                                "channels": message.get("channels", []),
                                "message": "Subscribed successfully"
                            }
                        }, client_id)
                    
                    # Handle agent status request
                    elif msg_type == "get_agents":
                        await manager.send_personal_message({
                            "type": "agent_update",
                            "timestamp": datetime.now().isoformat(),
                            "data": {"delegates": DELEGATES}
                        }, client_id)
                    
                    # Handle broadcast request (for testing)
                    elif msg_type == "broadcast":
                        await manager.broadcast({
                            "type": "broadcast",
                            "timestamp": datetime.now().isoformat(),
                            "data": message.get("data", {}),
                            "from": client_id
                        })
                    
                    # Echo other messages
                    else:
                        await manager.send_personal_message({
                            "type": "echo",
                            "timestamp": datetime.now().isoformat(),
                            "data": message
                        }, client_id)
                        
                except json.JSONDecodeError:
                    # Handle non-JSON messages
                    await manager.send_personal_message({
                        "type": "message",
                        "timestamp": datetime.now().isoformat(),
                        "data": {"raw": data}
                    }, client_id)
                    
            except asyncio.TimeoutError:
                # Send periodic heartbeat
                await websocket.send_text(json.dumps({
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)

# Background task to simulate real-time updates
async def simulate_realtime_updates():
    """Simulate real-time agent status updates every 5 seconds"""
    while manager._running:
        await asyncio.sleep(5)
        try:
            # Simulate random agent status changes
            import random
            if DELEGATES and random.random() < 0.3:  # 30% chance
                agent = random.choice(DELEGATES)
                statuses = ["active", "idle", "busy", "error"]
                agent["status"] = random.choice(statuses)
                agent["last_update"] = datetime.now().isoformat()
                
                await manager.broadcast({
                    "type": "agent_status_change",
                    "timestamp": datetime.now().isoformat(),
                    "data": {
                        "agent_id": agent["id"],
                        "agent_name": agent["name"],
                        "status": agent["status"]
                    }
                })
        except Exception as e:
            print(f"Error in simulate_realtime_updates: {e}")

# Startup/shutdown events
@app.on_event("startup")
async def startup_event():
    print("Starting up...")
    # Start background task
    asyncio.create_task(simulate_realtime_updates())

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down...")
    manager._running = False

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
