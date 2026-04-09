#!/usr/bin/env python3
"""
Sherlock Visage Agent Telemetry - Test & Demo Client
Tests REST endpoints and WebSocket streaming
"""

import asyncio
import json
import sys
import argparse

try:
    import websockets
    import aiohttp
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "aiohttp", "-q"])
    import websockets
    import aiohttp


async def test_rest_endpoints(base_url: str):
    """Test all REST endpoints"""
    print("\n" + "="*60)
    print("📡 Testing REST Endpoints")
    print("="*60)
    
    async with aiohttp.ClientSession() as session:
        # Test root endpoint
        async with session.get(f"{base_url}/") as resp:
            data = await resp.json()
            print(f"\n✅ Root API: {data['service']}")
            print(f"   Status: {data['status']}")
        
        # Test agents status
        async with session.get(f"{base_url}/api/agents/status") as resp:
            status = await resp.json()
            print(f"\n✅ System Status:")
            print(f"   Total Agents: {status['total_agents']}")
            print(f"   Online: {status['online_agents']}, Busy: {status['busy_agents']}")
            print(f"   Idle: {status['idle_agents']}, Offline: {status['offline_agents']}")
            print(f"   Total Cost: ${status['total_cost_usd']:.4f}")
        
        # Test list agents
        async with session.get(f"{base_url}/api/agents") as resp:
            data = await resp.json()
            print(f"\n✅ Agent Registry ({data['count']} agents):")
            for agent in data['agents'][:5]:  # Show first 5
                print(f"   • {agent['id']}: {agent['name']} ({agent['model']}) - {agent['status']}")
            if len(data['agents']) > 5:
                print(f"   ... and {len(data['agents']) - 5} more")
        
        # Test agent details - sherlock_3d
        async with session.get(f"{base_url}/api/agents/sherlock_3d/details") as resp:
            if resp.status == 200:
                data = await resp.json()
                agent = data['agent']
                print(f"\n✅ Agent Details (sherlock_3d):")
                print(f"   Name: {agent['name']}")
                print(f"   Model: {agent['model']}")
                print(f"   Status: {agent['status']}")
                print(f"   Cost: ${agent['total_cost']:.4f}")
                print(f"   Tasks Completed: {agent['completed_tasks']}")
        
        # Test create task
        task_data = {
            "name": "Demo Task",
            "description": "Testing the telemetry system",
            "metadata": {"priority": "high", "source": "test_client"}
        }
        async with session.post(
            f"{base_url}/api/agents/volt_fintech/task",
            json=task_data
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                task = data['task']
                print(f"\n✅ Created Task:")
                print(f"   ID: {task['id']}")
                print(f"   Name: {task['name']}")
                print(f"   Status: {task['status']}")
                print(f"   Message: {data['message']}")


async def websocket_client(uri: str, duration: int = 15):
    """Connect to WebSocket and display real-time updates"""
    print("\n" + "="*60)
    print("🔌 WebSocket Client - Real-time Telemetry Stream")
    print("="*60)
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as ws:
            print("✅ Connected! Listening for updates...\n")
            
            start_time = asyncio.get_event_loop().time()
            message_count = 0
            
            while (asyncio.get_event_loop().time() - start_time) < duration:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    data = json.loads(msg)
                    msg_type = data.get('type', 'unknown')
                    
                    message_count += 1
                    timestamp = data.get('timestamp', '').split('T')[1][:8] if 'timestamp' in data else '---'
                    
                    if msg_type == 'connected':
                        print(f"[{timestamp}] 🎉 {data.get('message')}")
                    
                    elif msg_type == 'system_status':
                        status = data.get('data', {})
                        print(f"[{timestamp}] 📊 System: {status.get('busy_agents', 0)} busy, "
                              f"${status.get('total_cost_usd', 0):.4f}")
                    
                    elif msg_type == 'agent_update':
                        agent = data.get('data', {})
                        emoji = "🟢" if agent.get('status') == 'online' else \
                                "🔴" if agent.get('status') == 'busy' else \
                                "🟡" if agent.get('status') == 'idle' else "⚪"
                        print(f"[{timestamp}] {emoji} {agent.get('id')}: {agent.get('status')} "
                              f"(${agent.get('total_cost', 0):.4f})")
                    
                    elif msg_type == 'task_update':
                        task = data.get('data', {})
                        print(f"[{timestamp}] 📋 Task {task.get('id')}: {task.get('status')} "
                              f"({task.get('progress', 0):.0f}%)")
                    
                    elif msg_type == 'heartbeat':
                        print(f"[{timestamp}] 💓 Heartbeat")
                        # Send ping back
                        await ws.send(json.dumps({"type": "ping"}))
                    
                    else:
                        print(f"[{timestamp}] ℹ️  {msg_type}")
                        
                except asyncio.TimeoutError:
                    # Send ping to keep alive
                    await ws.send(json.dumps({"type": "ping"}))
                    
            print(f"\n✅ Received {message_count} messages over {duration} seconds")
            
    except Exception as e:
        print(f"\n❌ WebSocket error: {e}")


async def main():
    parser = argparse.ArgumentParser(description="Test Sherlock Visage Agent Telemetry")
    parser.add_argument("--host", default="localhost", help="Server host")
    parser.add_argument("--port", type=int, default=8000, help="Server port")
    parser.add_argument("--skip-rest", action="store_true", help="Skip REST tests")
    parser.add_argument("--skip-ws", action="store_true", help="Skip WebSocket tests")
    parser.add_argument("--ws-duration", type=int, default=15, help="WebSocket test duration (seconds)")
    
    args = parser.parse_args()
    
    base_url = f"http://{args.host}:{args.port}"
    ws_url = f"ws://{args.host}:{args.port}/ws/agents"
    
    print("\n╔════════════════════════════════════════════════════════════╗")
    print("║     Sherlock Visage - Agent Telemetry Test Client          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    try:
        if not args.skip_rest:
            await test_rest_endpoints(base_url)
        
        if not args.skip_ws:
            await websocket_client(ws_url, args.ws_duration)
        
        print("\n" + "="*60)
        print("✅ All tests completed successfully!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
