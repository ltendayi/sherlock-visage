# 🚀 SHERLOCK VISAGE - RESTART & DEPLOYMENT GUIDE

## 📊 CURRENT DISK STATUS (HEALTHY!)
- **Total:** 29GB
- **Used:** 19GB (68%)
- **Available:** 9.1GB ✅
- **No additional disk needed!**

## ✅ PROJECTS READY FOR RESTART:

### 1. **Hermes Agent** (AI Assistant)
- ✅ Configuration: `~/.hermes/config.yaml`
- ✅ 6 Skills created (including 3 horizontal skills)
- ✅ Efficiency Guards: ACTIVE
- ✅ Advanced Delegation Pattern: VALIDATED
- ✅ /sethome skill: FUNCTIONAL

### 2. **Sherlock Visage Dashboard** (AI Operations Center)
- ✅ Frontend: React + TypeScript + Ant Design (built to `/dist/`)
- ✅ Backend: FastAPI with PostgreSQL + SQLite + WebSocket
- ✅ Integration: Frontend connects to backend with mock fallback
- ✅ Docker: Full containerization ready
- ✅ Startup script: `start-sherlock.sh`

## 🔧 RESTART PROCEDURE:

### Step 1: Stop current services (if any)
```bash
# Stop Python HTTP server (port 8080)
pkill -f "python.*serve.py"

# Stop backend (port 8000)  
pkill -f "uvicorn.*app.main"
```

### Step 2: Start Sherlock Visage
```bash
cd /home/tendayi/Hermes-Amara
chmod +x start-sherlock.sh
./start-sherlock.sh
```

### Step 3: Verify services
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend (dev server)
curl http://localhost:8080

# Access dashboard
# 🌐 Frontend: http://localhost:8080
# 🔧 Backend API: http://localhost:8000/api/docs
```

## 🐳 DOCKER DEPLOYMENT (Alternative):
```bash
cd /home/tendayi/Hermes-Amara

# Start full stack with Docker Compose
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

## 📡 SERVICES AVAILABLE:

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend Dashboard** | http://localhost:8080 | 8080 | Ready |
| **Backend API** | http://localhost:8000 | 8000 | Ready |
| **API Docs** | http://localhost:8000/api/docs | 8000 | Ready |
| **Health Check** | http://localhost:8000/health | 8000 | Ready |
| **WebSocket** | ws://localhost:8000/ws | 8000 | Ready |

## 🔒 SECURITY NOTES:

### PostgreSQL Database:
- Database: `shavi_dev_db`
- User: `shavi_dev`
- Password: `devpassword` (change in production!)
- Port: 5433 (mapped from 5432)

### JWT Authentication:
- Secret: `your-secret-key-change-in-production`
- Algorithm: HS256
- Token expiry: 30 minutes

## 🛠️ TROUBLESHOOTING:

### If backend fails to start:
```bash
cd /home/tendayi/Hermes-Amara/sherlock-backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### If frontend fails to start:
```bash
cd /home/tendayi/Hermes-Amara/sherlock-visage
npm run dev
```

### Check disk space:
```bash
df -h
# Should show ~9GB available
```

## 📈 MONITORING POST-DEPLOYMENT:

Dashboard will show:
- ✅ Real-time 7 AI delegate status
- ✅ Cost monitoring ($280-570 monthly budget)
- ✅ Token efficiency (Delta vs Full file comparison)
- ✅ System health (80% target score)
- ✅ Nairobi floorplan visualization
- ✅ Trello-style task board

## 🎯 FINAL VERIFICATION:

After restart, test:
1. **Dashboard loads**: http://localhost:8080
2. **API responds**: `curl http://localhost:8000/health`
3. **Hermes skills work**: Test `/sethome` command
4. **Efficiency guards active**: Check Hermes memory

## 💾 BACKUP LOCATIONS:

- **Hermes config**: `~/.hermes/`
- **Project code**: `/home/tendayi/Hermes-Amara/`
- **Skills**: `~/.hermes/skills/` (6 skills created)
- **Memory**: `~/.hermes/memories/USER.md` (your location saved)

## ⚡ QUICK START:
```bash
# After restart, just run:
cd /home/tendayi/Hermes-Amara
./start-sherlock.sh
```

**✅ PROJECT IS FULLY READY FOR RESTART!**