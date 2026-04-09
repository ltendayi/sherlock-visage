#!/bin/bash
# Test SSH access to Sherlock Visage

echo "🧪 Testing Sherlock Visage SSH Access..."

# Get server IP
IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $IP"

echo ""
echo "1️⃣ Testing local services..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running locally"
else
    echo "❌ Backend not running locally"
    echo "   Start with: ./start-sherlock.sh"
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend is running locally"
else
    echo "❌ Frontend not running locally"
fi

echo ""
echo "2️⃣ Testing remote accessibility..."
echo "   From ANOTHER machine, run:"
echo "   nc -zv $IP 22 && echo '✅ SSH port open' || echo '❌ SSH port closed'"
echo "   nc -zv $IP 8080 && echo '✅ Dashboard port open' || echo '❌ Dashboard port closed'"
echo "   nc -zv $IP 8000 && echo '✅ API port open' || echo '❌ API port closed'"

echo ""
echo "3️⃣ Quick SSH tunnel test command:"
echo "   ssh -o ConnectTimeout=5 -o ConnectionAttempts=1 tendayi@$IP 'echo ✅ SSH connection successful'"

echo ""
echo "4️⃣ Complete test script for your local machine:"
cat << 'EOF'
#!/bin/bash
# Save this as test-sherlock-remote.sh on your LOCAL machine

SERVER_IP="10.0.0.4"  # Replace with your server IP

echo "Testing connection to Sherlock Visage at $SERVER_IP..."

# Test SSH
echo -n "SSH connection: "
if ssh -o ConnectTimeout=5 -o ConnectionAttempts=1 tendayi@$SERVER_IP "echo 'SSH OK'" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ Failed"
    exit 1
fi

# Test ports
echo -n "Port 8080 (Dashboard): "
if nc -zv $SERVER_IP 8080 > /dev/null 2>&1; then
    echo "✅ Open"
else
    echo "⚠️  Closed (may need ./start-sherlock-remote.sh on server)"
fi

echo -n "Port 8000 (API): "
if nc -zv $SERVER_IP 8000 > /dev/null 2>&1; then
    echo "✅ Open"
else
    echo "⚠️  Closed"
fi

echo ""
echo "To set up SSH tunnel:"
echo "ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@$SERVER_IP"
echo ""
echo "Then open: http://localhost:8080"
EOF

echo ""
echo "🔧 For immediate access, run on SERVER:"
echo "   ./start-sherlock-remote.sh"
echo ""
echo "🔌 Then from your LOCAL machine:"
echo "   ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@$IP"
echo "   # Open browser to http://localhost:8080"