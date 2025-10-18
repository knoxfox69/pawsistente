#!/bin/bash

# Purpose: Deploy Pawsistente production stack for cloud deployment
# Context: Uses docker-compose.prod.yml with internal networking only

set -e

echo "🚀 Deploying Pawsistente Production Stack..."

# Build the production image
echo "📦 Building production Docker image..."
docker-compose -f docker-compose.prod.yml build app

echo "✅ Build complete!"
echo ""
echo "🔧 To deploy to cloud platforms (Cosmos Cloud, etc.):"
echo "1. Push your images to a registry (Docker Hub, etc.)"
echo "2. In your cloud platform, configure your main service to:"
echo "   - Use the pawsistente-app image"
echo "   - Set PORT=80 (nginx internal port)"
echo "   - Let the platform handle external routing"
echo ""
echo "📋 Cloud Platform Configuration:"
echo "   - Main App:"
echo "     - Internal Port: 80"
echo "     - Protocol: HTTP"
echo "     - Health Check: /health"
echo "   - Environment Variables:"
echo "     - NODE_ENV=production"
echo "     - PORT=3000 (internal SvelteKit port)"
echo ""
echo "🔍 Internal Services (for monitoring):"
echo "   - Prometheus: port 9090 (internal only)"
echo "   - Grafana: port 3000 (internal only)"
echo "   - Node Exporter: port 9100 (internal only)"
echo "   - cAdvisor: port 8080 (internal only)"
echo ""
echo "🌐 Networking:"
echo "   - All services communicate internally via Docker networks"
echo "   - No external port bindings"
echo "   - Cosmos Cloud handles external routing to port 80"
echo ""
echo "🎉 Ready for cloud deployment!"
