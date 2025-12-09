#!/bin/bash

echo "🎮 ARC Raiders Companion - Server Launcher"
echo "=========================================="
echo ""
echo "This will open TWO terminal windows:"
echo "  1. Backend server (port 5001)"
echo "  2. Frontend server (port 3002)"
echo ""
echo "Press Ctrl+C in each window to stop the servers."
echo ""
read -p "Press Enter to start..."

# Start backend in new terminal
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'/server\" && echo \"🔧 BACKEND SERVER\" && echo \"==================\" && npm run dev"'

sleep 2

# Start frontend in new terminal  
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && echo \"🎨 FRONTEND SERVER\" && echo \"==================\" && npm run dev"'

echo ""
echo "✅ Two terminal windows opened!"
echo ""
echo "Wait for both to say 'ready', then:"
echo "👉 Open: http://localhost:3002"
echo ""
