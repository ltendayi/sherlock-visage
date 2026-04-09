#!/usr/bin/env python3
"""
Sherlock Visage Agent Telemetry - Quick Start Script
Usage:
    python start_telemetry.py          # Start on default port 8000
    python start_telemetry.py --port 8080  # Start on custom port
"""

import argparse
import sys
import os

# Add the directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    parser = argparse.ArgumentParser(
        description="Sherlock Visage Agent Telemetry Server"
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host to bind (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind (default: 8000)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--log-level",
        default="info",
        choices=["debug", "info", "warning", "error", "critical"],
        help="Logging level (default: info)"
    )
    
    args = parser.parse_args()
    
    print("""
╔══════════════════════════════════════════════════════════════════╗
║           Sherlock Visage - Agent Telemetry System               ║
║                                                                  ║
║  🚀 WebSocket: ws://{host}:{port}/ws/agents                 ║
║  📊 REST API: http://{host}:{port}/api/agents/status        ║
║  📖 Docs: http://{host}:{port}/docs                         ║
╚══════════════════════════════════════════════════════════════════╝
    """.format(host=args.host, port=args.port))
    
    import uvicorn
    uvicorn.run(
        "agent_telemetry:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level=args.log_level,
    )

if __name__ == "__main__":
    main()
