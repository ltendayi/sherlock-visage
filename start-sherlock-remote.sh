#!/bin/bash
# Start Sherlock Visage for remote access

echo "🚀 Starting Sherlock Visage for remote access..."

# Kill existing services
pkill -f "python.*serve.py" 2>/dev/null
pkill -f "uvicorn.*app.main" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null

# Start backend
echo "🔧 Starting FastAPI backend..."
cd /home/tendayi/Hermes-Amara/sherlock-backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Start backend on all interfaces
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID) on 0.0.0.0:8000"

# Start frontend dev server on all interfaces
echo "🎨 Starting frontend dev server..."
cd /home/tendayi/Hermes-Amara/sherlock-visage
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID) on 0.0.0.0:8080"

# Wait for services
sleep 3
echo ""
echo "=========================================="
echo "📱 SHERLOCK VISAGE REMOTE ACCESS READY!"
echo "=========================================="
echo ""
echo "Server IP: $(hostname -I | awk '{print $1}')"
echo ""
echo "🌐 Direct Access:"
echo "  Dashboard: http://$(hostname -I | awk '{print $1}'):8080"
echo "  API: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "🔌 SSH Tunnel (Recommended):"
echo "  ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@$(hostname -I | awk '{print $1}')"
echo "  Then access: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop services"
echo "=========================================="

# Monitor and cleanup
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait
