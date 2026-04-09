# 🪟 WINDOWS SSH ACCESS GUIDE

## 📡 SERVER INFORMATION:
- **Server IP:** `10.0.0.4`
- **Username:** `tendayi`
- **Frontend Port:** `3000` (not 8080!)
- **Backend Port:** `8000`

## 🔌 WINDOWS SSH TUNNEL SETUP:

### **Method 1: Windows PowerShell (Recommended)**
```powershell
# Open PowerShell as Administrator (if needed for port binding)
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4
```

### **Method 2: Windows Terminal**
Same command as above - works in Windows Terminal too.

### **Method 3: Git Bash**
If you have Git installed:
```bash
# Open Git Bash
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4
```

### **Method 4: PuTTY (GUI)**
1. Download and open PuTTY
2. Enter `10.0.0.4` as Host Name, Port `22`
3. Go to **Connection → SSH → Tunnels**
4. Add two port forwards:
   - **Source:** `3000` → **Destination:** `localhost:3000` → Add
   - **Source:** `8000` → **Destination:** `localhost:8000` → Add
5. Go back to Session, save as "Sherlock", then Open

## 🌐 ACCESS AFTER SSH TUNNEL:

**Open these in your Windows browser:**
- **Dashboard:** http://localhost:3000/
- **API Documentation:** http://localhost:8000/api/docs
- **Health Check:** http://localhost:8000/health

## ⚙️ PERMANENT SSH CONFIG (Windows):

### **Option A: SSH Config File**
Create `C:\Users\YourUsername\.ssh\config` (create folder if needed):
```config
Host sherlock
  HostName 10.0.0.4
  User tendayi
  LocalForward 3000 localhost:3000
  LocalForward 8000 localhost:8000
  ServerAliveInterval 60
```

Then just use: `ssh sherlock`

### **Option B: PowerShell Profile**
Add to your PowerShell profile:
```powershell
function Connect-Sherlock {
    ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4
}

Set-Alias sherlock Connect-Sherlock
```

Then: `sherlock`

## 🔧 START SERVICES ON SERVER:

**On the SERVER (via SSH):**
```bash
cd /home/tendayi/Hermes-Amara
./start-sherlock-remote-3000.sh
```

**Or if services already running on port 3000:**
```bash
# Just create SSH tunnel from Windows
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4
```

## 🛠️ WINDOWS TROUBLESHOOTING:

### **"Port already in use" error**
```powershell
# Check what's using port 3000 on Windows:
netstat -ano | findstr :3000

# Kill the process (replace PID):
taskkill /PID [PID] /F
```

### **"Permission denied" for port binding**
Run PowerShell **as Administrator**.

### **SSH not recognized**
Enable OpenSSH in Windows:
```powershell
# Windows Features → Open "Turn Windows features on or off"
# Check: OpenSSH Client
```

### **Connection timeout**
Check Windows Firewall:
```powershell
# Allow SSH through firewall
New-NetFirewallRule -DisplayName "SSH Port 22" -Direction Inbound -Protocol TCP -LocalPort 22 -Action Allow
```

## 📱 QUICK START SCRIPT FOR WINDOWS:

Save as `sherlock.ps1` on your Windows desktop:
```powershell
# Sherlock Visage Access Script for Windows
$ServerIP = "10.0.0.4"

Write-Host "🔌 Connecting to Sherlock Visage Dashboard..." -ForegroundColor Cyan
Write-Host "Server: $ServerIP" -ForegroundColor Yellow
Write-Host "Ports: 3000 (Dashboard), 8000 (API)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📡 Creating SSH tunnel..." -ForegroundColor Green

# Start SSH tunnel
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@$ServerIP

Write-Host ""
Write-Host "✅ Connection closed." -ForegroundColor Red
Write-Host "📱 Open browser to: http://localhost:3000" -ForegroundColor Cyan
```

## 🎯 WINDOWS TEST COMMANDS:

### **Test SSH Connection:**
```powershell
ssh -o ConnectTimeout=5 tendayi@10.0.0.4 "echo '✅ SSH connection successful'"
```

### **Test After Tunnel:**
```powershell
# After SSH tunnel is established
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"sherlock-visage-backend"}
```

## 🔐 WINDOWS FIREWALL NOTES:

If Windows Firewall blocks localhost access:
```powershell
# Allow localhost connections
New-NetFirewallRule -DisplayName "Allow Localhost Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Allow Localhost Port 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

## 🚀 ONE-COMMAND SOLUTION:

**Copy this to PowerShell:**
```powershell
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4; Write-Host '📱 Open: http://localhost:3000' -ForegroundColor Cyan"
```

## 📞 VERIFICATION CHECKLIST:

1. ✅ Server running: `./start-sherlock-remote-3000.sh` on server
2. ✅ Windows SSH client working
3. ✅ SSH tunnel: `ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4`
4. ✅ Browser: http://localhost:3000 loads dashboard
5. ✅ API: http://localhost:8000/health returns "healthy"

## 🎁 BATCH FILE FOR EASY ACCESS:

Save as `sherlock.bat`:
```batch
@echo off
echo 🔌 Connecting to Sherlock Visage Dashboard...
echo Server: 10.0.0.4
echo Port 3000: Dashboard
echo Port 8000: API
echo.
echo 📡 Starting SSH tunnel...
ssh -L 3000:localhost:3000 -L 8000:localhost:8000 tendayi@10.0.0.4
echo.
echo 📱 Open browser to: http://localhost:3000
pause
```