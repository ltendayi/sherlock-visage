#!/usr/bin/env python3
"""
Simple HTTP server for Sherlock Visage dashboard
"""

import http.server
import socketserver
import os
import sys

PORT = 8080
DIRECTORY = "dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    if not os.path.exists(DIRECTORY):
        print(f"Error: {DIRECTORY} directory not found. Run 'npm run build' first.")
        sys.exit(1)
    
    print(f"Serving Sherlock Visage dashboard on http://localhost:{PORT}")
    print(f"Dashboard files from: {os.path.abspath(DIRECTORY)}")
    print("Press Ctrl+C to stop")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")