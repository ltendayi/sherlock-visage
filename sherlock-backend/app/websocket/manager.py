"""
WebSocket manager for real-time updates
"""

import asyncio
import json
from typing import Dict, Set, Optional, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
from app.core.logging import setup_logger
from app.schemas.dashboard import RealTimeUpdate

logger = setup_logger()

class WebSocketManager:
    """
    Manages WebSocket connections and real-time updates
    """
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.tenant_connections: Dict[int, Set[WebSocket]] = {}
        self._running = False
        self._tasks: Set[asyncio.Task] = set()
    
    async def start(self):
        """Start WebSocket manager"""
        self._running = True
        logger.info("WebSocket manager started")
    
    async def stop(self):
        """Stop WebSocket manager"""
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        # Close all connections
        for connections in self.active_connections.values():
            for connection in connections:
                await connection.close()
        
        self.active_connections.clear()
        self.tenant_connections.clear()
        logger.info("WebSocket manager stopped")
    
    async def connect(self, websocket: WebSocket, client_id: str, tenant_id: Optional[int] = None):
        """
        Accept WebSocket connection
        
        Args:
            websocket: WebSocket connection
            client_id: Unique client identifier
            tenant_id: Tenant ID for tenant-specific connections
        """
        await websocket.accept()
        
        # Add to active connections
        if client_id not in self.active_connections:
            self.active_connections[client_id] = set()
        self.active_connections[client_id].add(websocket)
        
        # Add to tenant connections if tenant_id provided
        if tenant_id:
            if tenant_id not in self.tenant_connections:
                self.tenant_connections[tenant_id] = set()
            self.tenant_connections[tenant_id].add(websocket)
        
        logger.info(f"WebSocket connected: {client_id} (tenant: {tenant_id})")
    
    def disconnect(self, websocket: WebSocket, client_id: str, tenant_id: Optional[int] = None):
        """
        Remove WebSocket connection
        
        Args:
            websocket: WebSocket connection
            client_id: Unique client identifier
            tenant_id: Tenant ID for tenant-specific connections
        """
        # Remove from active connections
        if client_id in self.active_connections:
            self.active_connections[client_id].discard(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
        
        # Remove from tenant connections
        if tenant_id and tenant_id in self.tenant_connections:
            self.tenant_connections[tenant_id].discard(websocket)
            if not self.tenant_connections[tenant_id]:
                del self.tenant_connections[tenant_id]
        
        logger.info(f"WebSocket disconnected: {client_id} (tenant: {tenant_id})")
    
    async def send_personal_message(self, message: str, client_id: str):
        """
        Send message to specific client
        
        Args:
            message: Message to send
            client_id: Client identifier
        """
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to {client_id}: {e}")
    
    async def send_tenant_message(self, message: str, tenant_id: int):
        """
        Send message to all clients of a tenant
        
        Args:
            message: Message to send
            tenant_id: Tenant ID
        """
        if tenant_id in self.tenant_connections:
            for connection in self.tenant_connections[tenant_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to send message to tenant {tenant_id}: {e}")
    
    async def broadcast(self, message: str):
        """
        Send message to all connected clients
        
        Args:
            message: Message to send
        """
        for client_connections in self.active_connections.values():
            for connection in client_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Failed to broadcast message: {e}")
    
    async def send_update(self, update: RealTimeUpdate, tenant_id: Optional[int] = None, client_id: Optional[str] = None):
        """
        Send real-time update
        
        Args:
            update: Real-time update data
            tenant_id: Tenant ID for tenant-specific updates
            client_id: Client ID for personal updates
        """
        message = json.dumps(update.dict())
        
        if client_id:
            await self.send_personal_message(message, client_id)
        elif tenant_id:
            await self.send_tenant_message(message, tenant_id)
        else:
            await self.broadcast(message)
    
    async def handle_client(self, websocket: WebSocket, client_id: str, tenant_id: Optional[int] = None):
        """
        Handle WebSocket client connection
        
        Args:
            websocket: WebSocket connection
            client_id: Unique client identifier
            tenant_id: Tenant ID for tenant-specific connections
        """
        try:
            # Connect client
            await self.connect(websocket, client_id, tenant_id)
            
            # Send initial connection confirmation
            initial_update = RealTimeUpdate(
                event_type="connected",
                data={
                    "client_id": client_id,
                    "tenant_id": tenant_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            await self.send_personal_message(json.dumps(initial_update.dict()), client_id)
            
            # Keep connection alive
            while self._running:
                try:
                    # Wait for client message (ping) or timeout
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                    
                    # Handle ping/pong
                    if data == "ping":
                        await websocket.send_text("pong")
                    
                    # Handle other messages
                    else:
                        try:
                            message = json.loads(data)
                            await self._handle_client_message(websocket, client_id, tenant_id, message)
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON from client {client_id}: {data}")
                            
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    try:
                        await websocket.send_text("ping")
                    except:
                        break
                        
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected normally: {client_id}")
        except Exception as e:
            logger.error(f"WebSocket error for client {client_id}: {e}")
        finally:
            self.disconnect(websocket, client_id, tenant_id)
    
    async def _handle_client_message(self, websocket: WebSocket, client_id: str, tenant_id: Optional[int], message: Dict[str, Any]):
        """
        Handle incoming client messages
        
        Args:
            websocket: WebSocket connection
            client_id: Client identifier
            tenant_id: Tenant ID
            message: Received message
        """
        message_type = message.get("type")
        
        if message_type == "subscribe":
            # Handle subscription requests
            channels = message.get("channels", [])
            await self._handle_subscription(client_id, tenant_id, channels)
            
            # Send subscription confirmation
            response = RealTimeUpdate(
                event_type="subscribed",
                data={
                    "channels": channels,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            await self.send_personal_message(json.dumps(response.dict()), client_id)
            
        elif message_type == "unsubscribe":
            # Handle unsubscription requests
            channels = message.get("channels", [])
            await self._handle_unsubscription(client_id, channels)
            
            # Send unsubscription confirmation
            response = RealTimeUpdate(
                event_type="unsubscribed",
                data={
                    "channels": channels,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            await self.send_personal_message(json.dumps(response.dict()), client_id)
            
        elif message_type == "ping":
            # Already handled above
            pass
            
        else:
            logger.warning(f"Unknown message type from client {client_id}: {message_type}")
    
    async def _handle_subscription(self, client_id: str, tenant_id: Optional[int], channels: list):
        """
        Handle channel subscriptions
        
        Args:
            client_id: Client identifier
            tenant_id: Tenant ID
            channels: List of channels to subscribe to
        """
        # TODO: Implement channel-based subscriptions
        # For now, we handle all updates for the tenant
        logger.info(f"Client {client_id} subscribed to channels: {channels}")
    
    async def _handle_unsubscription(self, client_id: str, channels: list):
        """
        Handle channel unsubscriptions
        
        Args:
            client_id: Client identifier
            channels: List of channels to unsubscribe from
        """
        logger.info(f"Client {client_id} unsubscribed from channels: {channels}")

# Global WebSocket manager instance
websocket_manager = WebSocketManager()