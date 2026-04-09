#!/bin/bash
# Sherlock Visage - SSH Access Setup Script

echo "🔧 Setting up SSH access for Sherlock Visage Dashboard..."

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📡 Server IP: $SERVER_IP"

# Create SSH tunnel instructions
echo ""
echo "=========================================="
echo "🚀 SSH TUNNEL ACCESS (RECOMMENDED)"
echo "=========================================="
echo ""
echo "From your LOCAL machine, run:"
echo ""
echo "For Dashboard access:"
echo "  ssh -L 8080:localhost:8080 tendayi@$SERVER_IP"
echo ""
echo "For Dashboard + API access:"
echo "  ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@$SERVER_IP"
echo ""
echo "Then open in browser:"
echo "  🌐 Dashboard: http://localhost:8080"
echo "  🔧 API Docs: http://localhost:8000/api/docs"
echo "  🏥 Health: http://localhost:8000/health"
echo ""
echo "=========================================="
echo "🌐 DIRECT BROWSER ACCESS"
echo "=========================================="
echo ""
echo "Option 1: Nginx Reverse Proxy"
echo "  sudo apt install nginx"
echo "  sudo cp nginx-sherlock.conf /etc/nginx/sites-available/sherlock"
echo "  sudo ln -s /etc/nginx/sites-available/sherlock /etc/nginx/sites-enabled/"
echo "  sudo systemctl restart nginx"
echo "  Access: http://$SERVER_IP"
echo ""
echo "Option 2: Port Forwarding"
echo "  Make sure services run on 0.0.0.0"
echo "  Access: http://$SERVER_IP:8080"
echo ""
echo "=========================================="
echo "🔐 FIREWALL SETUP (if needed)"
echo "=========================================="
echo ""
echo "If using ufw firewall:"
echo "  sudo ufw allow 22/tcp          # SSH"
echo "  sudo ufw allow 8080/tcp        # Dashboard"
echo "  sudo ufw allow 8000/tcp        # API"
echo "  sudo ufw allow 80/tcp          # HTTP (if using nginx)"
echo "  sudo ufw enable"
echo ""
echo "If using iptables:"
echo "  sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT"
echo "  sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT"
echo "  sudo iptables-save"
echo ""
echo "=========================================="
echo "📱 CLIENT-SIDE SSH CONFIG"
echo "=========================================="
echo ""
echo "Add to ~/.ssh/config on your LOCAL machine:"
echo ""
echo "Host sherlock"
echo "  HostName $SERVER_IP"
echo "  User tendayi"
echo "  LocalForward 8080 localhost:8080"
echo "  LocalForward 8000 localhost:8000"
echo "  ServerAliveInterval 60"
echo "  ServerAliveCountMax 3"
echo ""
echo "Then just use: ssh sherlock"
echo ""
echo "=========================================="
echo "🔄 START SERVICES FOR REMOTE ACCESS"
echo "=========================================="
echo ""
echo "Run this on the server to start services accessible remotely:"
echo ""
echo "cd /home/tendayi/Hermes-Amara"
echo "./start-sherlock-remote.sh"
echo ""

# Create remote startup script
cat > /home/tendayi/Hermes-Amara/start-sherlock-remote.sh << 'EOF'
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
EOF

chmod +x /home/tendayi/Hermes-Amara/start-sherlock-remote.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start services for remote access:"
echo "  ./start-sherlock-remote.sh"
echo ""
echo "To use SSH tunnel (from your local machine):"
echo "  ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@$SERVER_IP"