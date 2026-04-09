# 🚀 QUICK SSH ACCESS GUIDE

## 📡 SERVER INFORMATION:
- **IP Address:** Run `hostname -I` on server
- **Username:** `tendayi`
- **SSH Port:** 22 (default)

## 🔌 METHOD 1: SSH TUNNEL (Easiest & Most Secure)

### From Your LOCAL Machine:
```bash
# Single command for everything:
ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@YOUR_SERVER_IP
```

### Then Open in Browser:
- **Dashboard:** http://localhost:8080
- **API Documentation:** http://localhost:8000/api/docs
- **Health Check:** http://localhost:8000/health

## 🌐 METHOD 2: DIRECT BROWSER ACCESS

### Step 1: Start Services for Remote Access
On the **SERVER**:
```bash
cd /home/tendayi/Hermes-Amara
./start-sherlock-remote.sh
```

### Step 2: Open in Browser
- **Dashboard:** http://YOUR_SERVER_IP:8080
- **API:** http://YOUR_SERVER_IP:8000

## ⚡ METHOD 3: SSH CONFIG FILE (Most Convenient)

Add to `~/.ssh/config` on your **LOCAL** machine:
```bash
Host sherlock
  HostName YOUR_SERVER_IP
  User tendayi
  LocalForward 8080 localhost:8080
  LocalForward 8000 localhost:8000
  ServerAliveInterval 60
```

Then just use:
```bash
ssh sherlock
# And open http://localhost:8080
```

## 🛡️ FIREWALL SETUP (If Blocked):

```bash
# If using ufw:
sudo ufw allow 8080/tcp
sudo ufw allow 8000/tcp
sudo ufw reload

# If using iptables:
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables-save
```

## 📱 TROUBLESHOOTING:

### "Connection Refused"
```bash
# On SERVER, check if services are running:
netstat -tulpn | grep -E '8080|8000'

# Start services if not running:
cd /home/tendayi/Hermes-Amara
./start-sherlock-remote.sh
```

### "Port Already in Use"
```bash
# Kill existing processes:
pkill -f "python.*serve.py"
pkill -f "uvicorn.*app.main"
pkill -f "npm run dev"
```

### Slow Connection
```bash
# Use compression in SSH:
ssh -C -L 8080:localhost:8080 tendayi@YOUR_SERVER_IP

# Or use mosh for unstable connections:
mosh tendayi@YOUR_SERVER_IP
# Then set up port forwarding within mosh
```

## 🎯 QUICK START CHEATSHEET:

### After Server Restart:
```bash
# On SERVER:
cd /home/tendayi/Hermes-Amara
./start-sherlock-remote.sh

# From LOCAL machine:
ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@YOUR_SERVER_IP
```

### Check Status:
```bash
# On SERVER:
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"sherlock-visage-backend"}

# From LOCAL (after SSH tunnel):
curl http://localhost:8000/health
```

## 🔐 SECURITY NOTES:

1. **SSH Tunnels are encrypted** - Recommended for production
2. **Direct access exposes ports** - Use firewall rules
3. **Consider adding authentication** to dashboard in production
4. **Use HTTPS** for production (Let's Encrypt + Nginx)

## 📞 TEST CONNECTION:

```bash
# Test SSH connection:
ssh tendayi@YOUR_SERVER_IP "echo 'SSH connection successful'"

# Test services from LOCAL (after tunnel):
curl -s http://localhost:8000/health | grep -q "healthy" && echo "✅ Backend healthy" || echo "❌ Backend down"
curl -s http://localhost:8080 | grep -q "Sherlock" && echo "✅ Frontend up" || echo "❌ Frontend down"
```

## 🎁 BONUS: ONE-LINER FOR QUICK ACCESS

Add to your local `.bashrc` or `.zshrc`:
```bash
alias sherlock='ssh -L 8080:localhost:8080 -L 8000:localhost:8000 tendayi@YOUR_SERVER_IP'
```

Then just type: `sherlock` and open http://localhost:8080