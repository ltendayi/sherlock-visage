#!/bin/bash
# Production startup for Sherlock Visage with Nginx

echo "🚀 Starting Sherlock Visage Production Stack..."

# Kill any existing processes
pkill -f "uvicorn.*8000" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# 1. Build frontend for production
echo "📦 Building React frontend..."
cd /home/tendayi/Hermes-Amara/sherlock-visage
npm run build

# 2. Start FastAPI backend
echo "🔧 Starting FastAPI backend..."
cd /home/tendayi/Hermes-Amara/sherlock-backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2 &
BACKEND_PID=$!

# 3. Restart Nginx
echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx

# 4. Wait for services to start
sleep 3

# 5. Display access information
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================"
echo "✅ SHERLOCK VISAGE PRODUCTION READY"
echo "========================================"
echo "🌐 Dashboard URL: http://$SERVER_IP"
echo "🔌 API Endpoint: http://$SERVER_IP/api/v1/delegates"
echo "📊 WebSocket: ws://$SERVER_IP/ws"
echo "💾 Backend: http://127.0.0.1:8000 (local only)"
echo "========================================"
echo ""

# Keep script running
wait $BACKEND_PID
