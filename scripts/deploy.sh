#!/bin/bash

# Purpose: Deployment script for Confuror Calendar
# Context: Builds and deploys the application using Docker Compose

set -e

echo "🚀 Starting Confuror Calendar deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show access information
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Access your application:"
echo "   • Confuror Calendar: http://localhost:3000"
echo "   • MongoDB Express: http://localhost:8081 (admin/admin123)"
echo ""
echo "📊 Service URLs:"
echo "   • App: http://localhost:3000"
echo "   • MongoDB: localhost:27017"
echo "   • Mongo Express: http://localhost:8081"
echo ""
echo "🔧 Management commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo "   • View status: docker-compose ps"
echo ""
echo "🎉 Happy coding!"
