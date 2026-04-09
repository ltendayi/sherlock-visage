#!/bin/bash
# Test script for Windows SSH access

echo "🧪 Testing Windows SSH Connection to Port 3000..."
echo ""

# Get server info
IP=$(hostname -I | awk '{print $1}')
echo "📡 Server IP: $IP"
echo "👤 Username: tendayi"
echo "🚪 SSH Port: 22"
echo "🎯 Dashboard Port: 3000"
echo "🔧 API Port: 8000"
echo ""

echo "✅ Services currently running:"
echo "------------------------------"
if pgrep -f "npm run dev" > /dev/null; then
    echo "Frontend (Port 3000): ✅ RUNNING"
else
    echo "Frontend (Port 3000): ❌ NOT RUNNING"
    echo "  Start with: ./start-sherlock-remote-3000.sh"
fi

if pgrep -f "uvicorn.*app.main" > /dev/null; then
    echo "Backend (Port 8000): ✅ RUNNING"
else
    echo "Backend (Port 8000): ❌ NOT RUNNING"
    echo "  Start with: ./start-sherlock-remote-3000.sh"
fi

echo ""
echo "🔌 WINDOWS SSH TUNNEL COMMAND:"
echo "------------------------------"
echo "Copy this to Windows PowerShell:"
echo ""
echo "ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@$IP"
echo ""
echo "Then open in Windows browser:"
echo "  🌐 Dashboard: http://localhost:3000"
echo "  🔧 API Docs: http://localhost:8000/api/docs"
echo "  🏥 Health: http://localhost:8000/health"
echo ""

echo "📱 WINDOWS TEST COMMANDS:"
echo "-------------------------"
echo "1. Test SSH connection from Windows:"
echo "   ssh -o ConnectTimeout=5 tendayi@$IP 'echo ✅ SSH OK'"
echo ""
echo "2. Test dashboard after tunnel:"
echo "   curl http://localhost:3000"
echo ""
echo "3. Test API after tunnel:"
echo "   curl http://localhost:8000/health"
echo ""

echo "🔄 QUICK START (if services not running):"
echo "----------------------------------------"
echo "On SERVER (this machine), run:"
echo "  cd /home/tendayi/Hermes-Amara"
echo "  ./start-sherlock-remote-3000.sh"
echo ""
echo "Then from WINDOWS:"
echo "  ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@$IP"
echo ""

echo "🔧 CURRENT NETWORK STATUS:"
echo "--------------------------"
echo "Port 3000 (check if accessible):"
nc -zv localhost 3000 2>&1 | grep -q "succeeded" && echo "✅ Port 3000 open locally" || echo "⚠️  Port 3000 not open"

echo "Port 8000 (check if accessible):"
nc -zv localhost 8000 2>&1 | grep -q "succeeded" && echo "✅ Port 8000 open locally" || echo "⚠️  Port 8000 not open"

echo ""
echo "🎯 FINAL VERIFICATION:"
echo "---------------------"
echo "From Windows, after SSH tunnel:"
echo "1. Open http://localhost:3000 → Should show Sherlock Visage dashboard"
echo "2. Open http://localhost:8000/health → Should show 'healthy'"
echo "3. Open http://localhost:8000/api/docs → Should show API documentation"
echo ""

echo "📋 TROUBLESHOOTING:"
echo "-------------------"
echo "If 'Connection refused' on Windows:"
echo "  1. Make sure services are running on server"
echo "  2. Check Windows Firewall isn't blocking localhost"
echo "  3. Try running PowerShell as Administrator"
echo ""
echo "If 'Port already in use' on Windows:"
echo "  netstat -ano | findstr :3000"
echo "  taskkill /PID [PID] /F"