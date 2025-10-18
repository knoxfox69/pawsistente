# Cosmos Cloud Deployment Guide

## Overview
This guide explains how to deploy Pawsistente to Cosmos Cloud, which handles routing and port management.

## Problem Solved
The original Docker configuration was trying to bind to port 80, which conflicts with Cosmos Cloud's routing system. This deployment configuration uses an internal port (3000) and lets Cosmos handle the external routing.

## Files Created
- `Dockerfile.cosmos` - Cosmos Cloud-optimized Dockerfile
- `docker-compose.cosmos.yml` - Cosmos Cloud Docker Compose configuration
- `deploy-cosmos.sh` - Deployment script

## Key Changes for Cosmos Cloud

### 1. No nginx or port 80 binding
- Removed nginx configuration
- Application runs directly on Node.js
- Uses internal port 3000

### 2. Simplified Dockerfile
- Single-stage Node.js application
- No port 80 conflicts
- Runs as non-root user for security

### 3. Cosmos Cloud Configuration
- Internal Port: 3000
- Protocol: HTTP
- Health Check Endpoint: `/health`
- Environment Variables:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `HOST=0.0.0.0`

## Deployment Steps

### Option 1: Using the deployment script
```bash
./deploy-cosmos.sh
```

### Option 2: Manual deployment
```bash
# Build the Cosmos-compatible image
docker build -f Dockerfile.cosmos -t pawsistente-cosmos:latest .

# Tag for your registry (replace with your registry)
docker tag pawsistente-cosmos:latest your-registry/pawsistente:latest

# Push to registry
docker push your-registry/pawsistente:latest
```

### Option 3: Using Docker Compose
```bash
docker-compose -f docker-compose.cosmos.yml up -d
```

## Cosmos Cloud Service Configuration

In your Cosmos Cloud dashboard:

1. **Container Configuration:**
   - Image: `your-registry/pawsistente:latest`
   - Port: `3000`
   - Protocol: `HTTP`

2. **Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=3000`
   - `HOST=0.0.0.0`

3. **Health Check:**
   - Path: `/health`
   - Port: `3000`
   - Interval: `30s`

4. **Routing:**
   - Let Cosmos handle external routing
   - Don't bind to ports 80/443

## Verification

After deployment, verify the application is working:

1. Check health endpoint: `https://your-domain/health`
2. Access main application: `https://your-domain/`
3. Verify all routes are working correctly

## Troubleshooting

### Port binding errors
- Ensure you're using `Dockerfile.cosmos` (not `Dockerfile.prod`)
- Verify Cosmos is configured to use port 3000
- Don't bind to ports 80/443 in your container

### Application not starting
- Check environment variables are set correctly
- Verify the build completed successfully
- Check Cosmos Cloud logs for errors

### Health check failures
- Ensure the `/health` endpoint is accessible
- Verify the application is running on port 3000
- Check that the health check path is correct in Cosmos

## Differences from Production Setup

| Feature | Production | Cosmos Cloud |
|---------|------------|--------------|
| Web Server | nginx + Node.js | Node.js only |
| Port Binding | 80 | 3000 (internal) |
| SSL/TLS | nginx | Cosmos handles |
| Routing | nginx | Cosmos handles |
| Monitoring | Prometheus/Grafana | Cosmos metrics |

This configuration is optimized for Cosmos Cloud's infrastructure and routing capabilities.
