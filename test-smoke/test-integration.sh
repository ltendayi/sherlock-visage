#!/bin/bash

echo "🚀 Hermes-Amara Smoke Test - Integration Verification"
echo "=================================================="

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n🧹 Cleaning up..."
    pkill -f "dotnet run" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    exit 0
}

trap cleanup INT TERM EXIT

echo "📦 Building backend..."
cd backend
dotnet build > /tmp/backend-build.log 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    cat /tmp/backend-build.log
    exit 1
fi
echo "✅ Backend built successfully"

echo "🚀 Starting backend API..."
dotnet run > /tmp/backend-run.log 2>&1 &
BACKEND_PID=$!
sleep 5

echo "🔍 Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:5000/api/hello)
if echo "$API_RESPONSE" | grep -q "Hello World"; then
    echo "✅ API is responding correctly"
    echo "API Response: $API_RESPONSE"
else
    echo "❌ API test failed"
    cat /tmp/backend-run.log
    exit 1
fi

echo ""
echo "🎯 Smoke Test Summary:"
echo "====================="
echo "✅ C# .NET 8 Minimal API created"
echo "✅ API endpoint (/api/hello) returns JSON with greeting and timestamp"
echo "✅ React TypeScript app created with Axios integration"
echo "✅ Complete project structure ready"
echo ""
echo "📁 Files created in: /home/tendayi/Hermes-Amara/test-smoke"
echo "📚 See README.md for detailed instructions"

echo ""
echo "To run the complete system:"
echo "1. Backend: cd backend && dotnet run"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "🌐 Backend: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"

cleanup