# 🔌 Port Registry - 3000-4050 Range
## Shavi Software Infrastructure - Nairobi HQ

**Last Updated:** 2026-04-09
**VPS IP:** 20.81.227.175

---

## 📊 Active Port Allocation (3000-3100)

| Port | Service | Project | Type | Status |
|------|---------|---------|------|--------|
| **3000** | Vite Dev | Sherlock Visage | 🛠️ Auto-spawned | ✅ Running |
| **3050** | Nginx Proxy | Sherlock Visage | 🌐 Public UI | ✅ Active |
| **3060** | Nginx Proxy | VoltLedger | 🌐 Public UI | 🔄 Staging |
| **3020** | FastAPI Backend | Sherlock Visage | 🔌 API | ✅ Active |
| **3030** | .NET API | VoltLedger | 🔌 API | ⏸️ Standby |
| **3040** | Vite Preview | Sherlock Visage | 👁️ Preview | Available |
| **3050** | Vite Preview | VoltLedger | 👁️ Preview | Available |
| **3060** | Vite Dev | Sherlock Visage | 🛠️ Development | Available |
| **3070** | Vite Dev | VoltLedger | 🛠️ Development | Available |

---

## 🔧 Infrastructure Ports (Unchanged)

| Port | Service | Description |
|------|---------|-------------|
| 5432 | PostgreSQL | VoltLedger Database |
| 6380 | Redis | Cache (avoiding 6379 conflict) |
| 8025 | Mailpit UI | Email testing web interface |
| 1025 | Mailpit SMTP | Email testing SMTP |

---

## 🌐 Public Access URLs

### Sherlock Visage
| Environment | URL |
|-------------|-----|
| **Production (Nginx)** | http://20.81.227.175:3050 |
| Dev Server (Auto) | http://20.81.227.175:3000 |
| API Direct | http://20.81.227.175:3020/api/agents/status |
| WebSocket Direct | ws://20.81.227.175:3020/ws/agents |
| Nginx API | http://20.81.227.175:3050/api/agents/status |
| Nginx WebSocket | ws://20.81.227.175:3050/ws/agents |

### VoltLedger
| Environment | URL |
|-------------|-----|
| **Production (Nginx)** | http://20.81.227.175:3060 |
| API Direct | http://20.81.227.175:3030/api/health |
| Nginx API | http://20.81.227.175:3060/api/health |
| Dev Server | http://20.81.227.175:3070 |
| Direct App | http://20.81.227.175:5000 (legacy) |

---

## 📝 Configuration Files

| Service | Config Path |
|---------|-------------|
| Sherlock Nginx | `/etc/nginx/sites-available/sherlock-visage` |
| VoltLedger Nginx | `/etc/nginx/sites-available/voltledger` |
| Sherlock Backend | `/home/tendayi/Hermes-Amara/sherlock-backend/` |
| VoltLedger Backend | `/home/tendayi/volt-ledger-ev/src/backend/` |

---

## 🚀 Restart Commands

```bash
# Sherlock Stack
cd /home/tendayi/Hermes-Amara/sherlock-backend && source venv/bin/activate && python start_telemetry.py --port 3020
cd /home/tendayi/Hermes-Amara/sherlock-visage && npm run preview -- --port 3040

# VoltLedger Stack
cd /home/tendayi/volt-ledger-ev && docker-compose up -d
cd /home/tendayi/volt-ledger-ev/src/backend && dotnet run --urls "http://0.0.0.0:3030"
cd /home/tendayi/volt-ledger-ev/src/frontend && npm run dev -- --port 3070

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔒 Port Reservation Policy

- **3000-3099**: Production Services (Nginx + APIs)
- **3100-3499**: Development/Preview Services
- **3500-3999**: Reserved for Future Projects
- **4000-4050**: Special/Internal Services

---

*Managed by: Sherlock Visage Agent Operations Center*
