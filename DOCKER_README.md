# Docker Setup Guide

## Overview

This project includes optimized Docker configurations for development, production, and monitoring with full ARM support and nginx integration.

## 🐳 Docker Configurations

### Production Dockerfile (`Dockerfile.prod`)
- **Multi-stage build** with nginx for static file serving
- **ARM support** (linux/amd64, linux/arm64)
- **Nginx reverse proxy** for optimal performance
- **Health checks** and proper signal handling
- **Security hardened** with non-root user

### Development Dockerfile (`Dockerfile.dev`)
- **Hot reload** support for development
- **Debugging enabled** with proper port mapping
- **Volume mounting** for live code changes
- **Development dependencies** included

## 📊 Monitoring Stack

### Grafana All-in-One Setup
- **Grafana** for dashboards and visualization
- **Prometheus** for metrics collection
- **Node Exporter** for system metrics
- **cAdvisor** for container metrics
- **Custom metrics** for application monitoring

## 🚀 Quick Start

### Development
```bash
# Build and run development container
npm run docker:dev

# Or manually:
./scripts/docker-dev.sh
```
- **URL**: http://localhost:5173
- **Features**: Hot reload, debugging, live code changes

### Production (Single Container)
```bash
# Build and run production container
npm run docker:prod

# Or manually:
./scripts/docker-build.sh
```
- **URL**: http://localhost
- **Features**: nginx optimization, ARM support, production-ready

### Production with Monitoring
```bash
# Start complete monitoring stack
npm run docker:monitoring

# Or manually:
./scripts/docker-monitoring.sh
```

## 🔧 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run docker:dev` | Build and run dev container with hot reload |
| Production | `npm run docker:prod` | Build and run optimized production container |
| Monitoring | `npm run docker:monitoring` | Start full stack with Grafana + Prometheus |
| Admin Stats | `npm run admin:stats` | Check access code usage from command line |

## 📈 Monitoring URLs

When using the monitoring stack:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost | - |
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Node Exporter** | http://localhost:9100 | - |
| **cAdvisor** | http://localhost:8080 | - |

## 🏗️ Architecture

### Production Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │   SvelteKit     │    │   Prometheus    │
│   (Port 80)     │◄──►│   (Port 3000)   │◄──►│   (Port 9090)   │
│  Static Files   │    │   API Routes    │    │   Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Grafana     │
                    │   (Port 3001)   │
                    │   Dashboards    │
                    └─────────────────┘
```

### Key Features

#### Nginx Integration
- **Static file serving** with proper caching headers
- **API proxying** to SvelteKit server
- **Gzip compression** for optimal performance
- **Security headers** (XSS, CSRF protection)
- **Health check endpoint** at `/health`

#### Metrics Collection
- **HTTP request metrics** (rate, duration, status codes)
- **Application metrics** (active sessions, access code usage)
- **System metrics** (CPU, memory, disk usage)
- **Container metrics** (resource usage, health status)

#### ARM Support
- **Multi-platform builds** (amd64, arm64)
- **Cross-compilation** support
- **Optimized for** Apple Silicon, ARM servers

## 🔒 Security Features

### Production Security
- **Non-root user** execution
- **Security headers** via nginx
- **Minimal attack surface** with alpine images
- **Health checks** for container orchestration
- **Read-only volumes** for static files

### Access Control
- **Admin API** restricted to localhost only
- **Metrics endpoint** available for monitoring
- **No sensitive data** in container images

## 📁 File Structure

```
├── Dockerfile.prod              # Production with nginx
├── Dockerfile.dev               # Development with hot reload
├── docker-compose.prod.yml      # Production stack with monitoring
├── scripts/
│   ├── docker-build.sh         # Production build script
│   ├── docker-dev.sh           # Development build script
│   └── docker-monitoring.sh    # Monitoring stack script
└── monitoring/
    ├── prometheus.yml           # Prometheus configuration
    └── grafana/
        ├── datasources/         # Grafana datasource configs
        └── dashboards/          # Custom dashboards
```

## 🛠️ Customization

### Environment Variables
```bash
# Production
NODE_ENV=production
PORT=3000

# Development
NODE_ENV=development
PORT=5173
```

### Volume Mounts
```bash
# Static files (read-only)
-v "$(pwd)/static:/app/static:ro"

# Source code (development)
-v "$(pwd)/src:/app/src:ro"
```

### Port Mappings
```bash
# Production
-p 80:80                    # Application
-p 3001:3000               # Grafana
-p 9090:9090               # Prometheus
-p 9100:9100               # Node Exporter
-p 8080:8080               # cAdvisor
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using port 80
   sudo lsof -i :80
   
   # Use different ports
   docker run -p 8080:80 pawsistente:latest
   ```

2. **Permission issues**
   ```bash
   # Fix script permissions
   chmod +x scripts/*.sh
   ```

3. **Build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild from scratch
   docker build --no-cache -f Dockerfile.prod .
   ```

### Debugging

```bash
# View container logs
docker logs -f pawsistente-prod

# Access container shell
docker exec -it pawsistente-prod sh

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 📊 Performance Optimization

### Nginx Configuration
- **Gzip compression** enabled
- **Static file caching** (1 year for assets)
- **Keep-alive connections** for better performance
- **Worker processes** optimized for CPU cores

### Container Optimization
- **Multi-stage builds** for smaller images
- **Alpine Linux** base images for minimal size
- **Layer caching** for faster builds
- **Health checks** for automatic recovery

## 🚀 Deployment

### Production Deployment
```bash
# Build production image
npm run docker:prod

# Or with monitoring
npm run docker:monitoring
```

### CI/CD Integration
```yaml
# Example GitHub Actions
- name: Build Production Image
  run: docker build -f Dockerfile.prod -t pawsistente:latest .
  
- name: Deploy to Production
  run: docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)
