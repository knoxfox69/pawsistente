#!/bin/bash

# Purpose: Deploy to Cosmos Cloud
# Context: Simple deployment script for Cosmos Cloud routing

set -e

echo "🚀 Deploying Pawsistente to Cosmos Cloud..."

# Build the Cosmos-compatible image
echo "📦 Building Docker image for Cosmos Cloud..."
docker build -f Dockerfile.cosmos -t pawsistente-cosmos:latest .

echo "✅ Build complete!"
echo ""
echo "🔧 To deploy to Cosmos Cloud:"
echo "1. Push your image to a registry (Docker Hub, etc.)"
echo "2. In Cosmos Cloud, configure your service to:"
echo "   - Use the registry image"
echo "   - Set PORT=3000"
echo "   - Let Cosmos handle the routing (don't bind to port 80/443)"
echo ""
echo "📋 Cosmos Cloud Configuration:"
echo "   - Internal Port: 3000"
echo "   - Protocol: HTTP"
echo "   - Health Check: /health"
echo "   - Environment: NODE_ENV=production"
echo ""
echo "🎉 Ready for Cosmos Cloud deployment!"
