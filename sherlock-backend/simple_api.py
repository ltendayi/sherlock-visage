#!/usr/bin/env python3
"""
Simple HTTP API server for Sherlock Visage
"""
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

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

class SherlockHandler(BaseHTTPRequestHandler):
    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        if self.path == '/api/v1/delegates':
            self._set_headers()
            response = {
                "delegates": DELEGATES,
                "count": len(DELEGATES),
                "timestamp": datetime.now().isoformat(),
                "service": "Sherlock Visage API",
                "version": "1.0.0"
            }
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/v1/metrics':
            self._set_headers()
            response = {
                "system": {
                    "health": 80,
                    "disk_usage_percent": 68,
                    "disk_available_gb": 9.1,
                    "memory_usage_percent": 45,
                    "uptime_seconds": 180  # 3 minutes
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
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/api/v1/system/health':
            self._set_headers()
            response = {"status": "healthy", "score": 80, "timestamp": datetime.now().isoformat()}
            self.wfile.write(json.dumps(response).encode())
        
        elif self.path == '/':
            self._set_headers()
            response = {
                "service": "Sherlock Visage API",
                "version": "1.0.0",
                "status": "running",
                "timestamp": datetime.now().isoformat(),
                "endpoints": [
                    "/api/v1/delegates",
                    "/api/v1/metrics",
                    "/api/v1/system/health"
                ]
            }
            self.wfile.write(json.dumps(response).encode())
        
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"error": "Not found", "path": self.path}
            self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

def start_server():
    server = HTTPServer(('127.0.0.1', 8000), SherlockHandler)
    print(f"✅ Sherlock API server started on http://127.0.0.1:8000")
    print(f"   • /api/v1/delegates - AI delegates list")
    print(f"   • /api/v1/metrics - System metrics")
    print(f"   • /api/v1/system/health - Health check")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")

if __name__ == '__main__':
    start_server()