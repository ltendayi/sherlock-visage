#!/bin/bash
echo "🚀 Starting Sherlock Visage Production Stack..."
echo ""

# 1. Ensure Nginx is running
sudo systemctl start nginx

# 2. Start Sherlock service
sudo systemctl start sherlock-visage

# 3. Enable auto-start on boot
sudo systemctl enable sherlock-visage

# 4. Show status
sleep 2
sudo systemctl status sherlock-visage --no-pager -l

# 5. Display access info
SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================"
echo "✅ SHERLOCK VISAGE PRODUCTION READY"
echo "========================================"
echo "🌐 Dashboard URL: http://$SERVER_IP"
echo "🔌 API Endpoint: http://$SERVER_IP/api/v1/delegates"
echo "📊 WebSocket: ws://$SERVER_IP/ws"
echo "💾 Systemd: sudo systemctl status sherlock-visage"
echo "========================================"
echo ""
echo "📋 Commands:"
echo "  sudo systemctl restart sherlock-visage  # Restart"
echo "  sudo systemctl stop sherlock-visage     # Stop"
echo "  journalctl -u sherlock-visage -f       # View logs"
echo "========================================"
