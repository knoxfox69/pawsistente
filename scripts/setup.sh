#!/bin/bash

# Purpose: Setup script for Pawsistente development environment
# Context: Automates the initial setup process for new developers

echo "🐾 Setting up Pawsistente - Confuror Calendar"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if MongoDB is running
if ! command -v mongod &> /dev/null && ! docker ps | grep -q mongo; then
    echo "⚠️  MongoDB is not running. Starting with Docker..."
    docker-compose up -d mongodb
    echo "⏳ Waiting for MongoDB to start..."
    sleep 10
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=confuror_calendar

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Seed the database
echo "🌱 Seeding database with sample events..."
npm run seed

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Start swiping through events! 🐾"
echo ""
echo "For production deployment, see README.md"
