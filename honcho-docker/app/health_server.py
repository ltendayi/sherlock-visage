#!/usr/bin/env python3
import http.server
import socketserver
import json
import psutil
import datetime

PORT = 8080

class HealthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # Get system metrics
            health_data = {
                "status": "healthy",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "system": {
                    "cpu_percent": psutil.cpu_percent(),
                    "memory_percent": psutil.virtual_memory().percent,
                    "memory_used_gb": round(psutil.virtual_memory().used / 1024 / 1024 / 1024, 2),
                    "memory_total_gb": round(psutil.virtual_memory().total / 1024 / 1024 / 1024, 2),
                    "disk_percent": psutil.disk_usage('/').percent,
                    "process_count": len(list(psutil.process_iter()))
                }
            }
            
            self.wfile.write(json.dumps(health_data, indent=2).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"[HealthServer] {args[0]}")

def run_server():
    with socketserver.TCPServer(("", PORT), HealthHandler) as httpd:
        print(f"[HealthServer] Running on port {PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("[HealthServer] Shutting down...")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
