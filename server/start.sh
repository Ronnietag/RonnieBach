#!/bin/bash
# MongoDB + Ronnie Portfolio Startup Script

echo "🚀 Starting Ronnie Portfolio with MongoDB..."

# Start MongoDB (if not running)
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    sudo mkdir -p /data/db /var/log/mongodb
    sudo chown -R ubuntu:ubuntu /data/db /var/log/mongodb
    mongod --config /home/ubuntu/.openclaw/workspace/ronnie-portfolio/server/mongod.conf --fork
    sleep 2
    echo "✅ MongoDB started"
else
    echo "✅ MongoDB already running"
fi

# Build frontend
echo "📦 Building frontend..."
cd /home/ubuntu/.openclaw/workspace/ronnie-portfolio
npm run build

# Restart server
echo "🚀 Restarting Express server..."
cd /home/ubuntu/.openclaw/workspace/ronnie-portfolio/server

# Kill existing server
pkill -f "node index.js" 2>/dev/null
sleep 1

# Start server
node index.js &

echo ""
echo "✅ Ronnie Portfolio is running!"
echo "   Web: http://43.207.100.207:3001/"
echo "   API: http://43.207.100.207:3001/api"
echo "   DB:  mongodb://127.0.0.1:27017/ronnie_portfolio"
