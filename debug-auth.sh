#!/bin/bash

echo "🔍 ARC Raiders Authentication Debug Tool"
echo "========================================"
echo ""

# Check if servers are running
echo "📡 Checking if servers are running..."
echo ""

# Check backend
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on port 5000"
    curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "   Response: $(curl -s http://localhost:5000/api/health)"
else
    echo "❌ Backend server is NOT running on port 5000"
    echo "   Run: cd server && npm run dev"
fi

echo ""

# Check frontend
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 3002"
else
    echo "❌ Frontend is NOT running on port 3002"
    echo "   Run: npm run dev"
fi

echo ""
echo "🔐 Testing authentication endpoints..."
echo ""

# Test registration
echo "📝 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}' 2>&1)

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo "✅ Registration endpoint works!"
    echo "   Response: User registered successfully"
elif echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
    echo "⚠️  User already exists (this is OK)"
    
    # Try login instead
    echo ""
    echo "🔑 Testing login with existing user..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"password123"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        echo "✅ Login endpoint works!"
        TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
        if [ ! -z "$TOKEN" ]; then
            echo "   JWT Token received: ${TOKEN:0:20}..."
        fi
    else
        echo "❌ Login failed"
        echo "   Response: $LOGIN_RESPONSE"
    fi
elif echo "$REGISTER_RESPONSE" | grep -q "Connection refused"; then
    echo "❌ Cannot connect to backend server"
    echo "   Make sure backend is running: cd server && npm run dev"
else
    echo "❌ Registration failed"
    echo "   Response: $REGISTER_RESPONSE"
fi

echo ""
echo "🗄️  Database configuration check..."
echo "   DB_NAME: $(grep DB_NAME server/.env | cut -d'=' -f2)"
echo "   DB_HOST: $(grep DB_HOST server/.env | cut -d'=' -f2)"
echo "   DB_USER: $(grep DB_USER server/.env | cut -d'=' -f2)"
echo "   JWT_SECRET: $(if grep -q 'your_super_secret' server/.env; then echo '⚠️  USING DEFAULT (change this!)'; else echo '✅ Custom secret set'; fi)"

echo ""
echo "📋 Common issues and solutions:"
echo ""
echo "1️⃣  Backend not running:"
echo "   → cd server && npm run dev"
echo ""
echo "2️⃣  Frontend not running:"
echo "   → npm run dev"
echo ""
echo "3️⃣  Database not connected:"
echo "   → Check server terminal for database errors"
echo "   → Verify database exists and credentials are correct"
echo ""
echo "4️⃣  CORS errors in browser console:"
echo "   → Check that frontend URL matches CORS origin in server/server.js"
echo ""
echo "5️⃣  'Invalid credentials' error:"
echo "   → Try registering a new account first"
echo "   → Check browser console (F12) for errors"
echo ""
echo "6️⃣  JWT_SECRET still default:"
echo "   → Generate new secret: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
echo "   → Update in server/.env"
echo ""
