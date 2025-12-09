#!/bin/bash

# ARC Raiders Companion - Quick Start Script
# This script helps you get the app running quickly

echo "🎮 ARC Raiders Companion - Quick Start"
echo "======================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "   Please install PostgreSQL first:"
    echo "   - Mac: brew install postgresql@16"
    echo "   - Ubuntu: sudo apt-get install postgresql"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL found"

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw arc_raiders_db; then
    echo "✅ Database 'arc_raiders_db' exists"
else
    echo "📊 Creating database 'arc_raiders_db'..."
    createdb arc_raiders_db
    
    echo "📝 Importing schema and game data..."
    psql -d arc_raiders_db -f database-schema.sql > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Database created and populated successfully!"
    else
        echo "❌ Failed to import schema. Please check database-schema.sql"
        exit 1
    fi
fi

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚙️  Creating server/.env from template..."
    cp server/.env.example server/.env
    echo "⚠️  Please edit server/.env with your database credentials!"
    echo "   Especially: DB_PASSWORD and JWT_SECRET"
    echo ""
    read -p "Press Enter when you've updated server/.env..."
fi

# Check if frontend .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating frontend .env..."
    cp .env.example .env
    echo "✅ Frontend .env created"
fi

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

echo ""
echo "🚀 Setup complete! Ready to start the app."
echo ""
echo "To run the application:"
echo "  1. Start backend:  cd server && npm run dev"
echo "  2. Start frontend: npm run dev"
echo ""
echo "Or run both in separate terminals."
echo ""
echo "📚 See SETUP.md for detailed instructions"
echo "📝 See IMPLEMENTATION_SUMMARY.md for complete overview"
echo ""
