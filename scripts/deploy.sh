#!/bin/bash

# Purpose: Single deployment script for Pawsistente with monitoring
# Context: Deploys production app + full monitoring stack in one command

set -e

echo "🚀 Pawsistente Production Deployment with Monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect current platform
detect_platform() {
    local arch=$(uname -m)
    case $arch in
        x86_64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        armv7l)
            echo "armv7"
            ;;
        *)
            print_warning "Unknown architecture: $arch. Defaulting to amd64."
            echo "amd64"
            ;;
    esac
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Get project info
PROJECT_NAME="pawsistente"
VERSION="latest"
IMAGE_NAME="${PROJECT_NAME}:${VERSION}"
APP_CONTAINER="${PROJECT_NAME}-prod"
PROMETHEUS_CONTAINER="${PROJECT_NAME}-prometheus"
GRAFANA_CONTAINER="${PROJECT_NAME}-grafana"
NODE_EXPORTER_CONTAINER="${PROJECT_NAME}-node-exporter"
NETWORK_NAME="${PROJECT_NAME}-monitoring"

# Detect current platform
CURRENT_PLATFORM=$(detect_platform)
print_status "Detected platform: $CURRENT_PLATFORM"

# Function to stop and remove container
cleanup_container() {
    local container_name=$1
    if docker ps -q -f name="$container_name" > /dev/null 2>&1; then
        print_warning "Stopping existing container: $container_name"
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
    elif docker ps -aq -f name="$container_name" > /dev/null 2>&1; then
        print_warning "Removing existing container: $container_name"
        docker rm "$container_name" 2>/dev/null || true
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        return 1
    else
        return 0
    fi
}

echo ""
print_status "🧹 Cleaning up existing containers..."

# Force cleanup any existing containers
docker rm -f "$APP_CONTAINER" "$PROMETHEUS_CONTAINER" "$GRAFANA_CONTAINER" "$NODE_EXPORTER_CONTAINER" 2>/dev/null || true

# Cleanup all existing containers
cleanup_container "$APP_CONTAINER"
cleanup_container "$PROMETHEUS_CONTAINER"
cleanup_container "$GRAFANA_CONTAINER"
cleanup_container "$NODE_EXPORTER_CONTAINER"

echo ""
print_status "🏗️  Building production Docker image..."

# Build the production image
docker build \
    --file Dockerfile.prod \
    --tag "$IMAGE_NAME" \
    --tag "${PROJECT_NAME}:prod" \
    --tag "${PROJECT_NAME}:${CURRENT_PLATFORM}" \
    .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Docker build failed!"
    exit 1
fi

echo ""
print_status "🌐 Creating monitoring network..."

# Create monitoring network
docker network create "$NETWORK_NAME" 2>/dev/null || true

echo ""
print_status "📊 Starting monitoring services..."

# Check available ports for monitoring services
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
NODE_EXPORTER_PORT=9100

if ! check_port 9090; then
    PROMETHEUS_PORT=9091
    print_warning "Port 9090 busy, using $PROMETHEUS_PORT"
fi

if ! check_port 3001; then
    GRAFANA_PORT=3002
    print_warning "Port 3001 busy, using $GRAFANA_PORT"
fi

if ! check_port 9100; then
    NODE_EXPORTER_PORT=9101
    print_warning "Port 9100 busy, using $NODE_EXPORTER_PORT"
fi

# Start Node Exporter
print_status "Starting Node Exporter on port $NODE_EXPORTER_PORT..."
docker run -d \
    --name "$NODE_EXPORTER_CONTAINER" \
    --network "$NETWORK_NAME" \
    -p "$NODE_EXPORTER_PORT:9100" \
    -v /proc:/host/proc:ro \
    -v /sys:/host/sys:ro \
    -v /:/rootfs:ro \
    prom/node-exporter:latest \
    --path.procfs=/host/proc \
    --path.rootfs=/rootfs \
    --path.sysfs=/host/sys \
    --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc)($$|/)'

# Start Prometheus
print_status "Starting Prometheus on port $PROMETHEUS_PORT..."
docker run -d \
    --name "$PROMETHEUS_CONTAINER" \
    --network "$NETWORK_NAME" \
    -p "$PROMETHEUS_PORT:9090" \
    -v "$(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
    prom/prometheus:latest \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/prometheus \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.console.templates=/etc/prometheus/consoles \
    --storage.tsdb.retention.time=200h \
    --web.enable-lifecycle

# Start Grafana
print_status "Starting Grafana on port $GRAFANA_PORT..."
docker run -d \
    --name "$GRAFANA_CONTAINER" \
    --network "$NETWORK_NAME" \
    -p "$GRAFANA_PORT:3000" \
    -e GF_SECURITY_ADMIN_USER=admin \
    -e GF_SECURITY_ADMIN_PASSWORD=admin123 \
    -e GF_USERS_ALLOW_SIGN_UP=false \
    -v "$(pwd)/monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro" \
    -v "$(pwd)/monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro" \
    grafana/grafana:latest

echo ""
print_status "🚀 Starting main application..."

# Check if CSV files exist
if [ ! -f "static/access_codes.csv" ]; then
    print_warning "access_codes.csv not found in static/. Creating default file..."
    echo "code,max_devices,description" > static/access_codes.csv
    echo "test123,3,Sample beta access code" >> static/access_codes.csv
fi

if [ ! -f "static/schedule.csv" ]; then
    print_warning "schedule.csv not found in static/. Creating default file..."
    echo "date,time,event,description" > static/schedule.csv
    echo "2025-10-20,15:00,Launch,Main application launch" >> static/schedule.csv
fi

print_status "📁 CSV files mounted:"
print_status "  Access codes: $(pwd)/static/access_codes.csv"
print_status "  Schedule: $(pwd)/static/schedule.csv"

# Check if port 80 is available
if check_port 80; then
    PORT_MAPPING="80:80"
    ACCESS_URL="http://localhost"
else
    PORT_MAPPING="8080:80"
    ACCESS_URL="http://localhost:8080"
    print_warning "Port 80 is busy. Using port 8080."
fi

# Start the main application
docker run -d \
    --name "$APP_CONTAINER" \
    --network "$NETWORK_NAME" \
    --restart unless-stopped \
    -p "$PORT_MAPPING" \
    -v "$(pwd)/static:/app/static:ro" \
    -v "$(pwd)/static/access_codes.csv:/app/static/access_codes.csv:ro" \
    -v "$(pwd)/static/schedule.csv:/app/static/schedule.csv:ro" \
    -e NODE_ENV=production \
    -e PORT=3000 \
    "$IMAGE_NAME"

echo ""
print_status "⏳ Waiting for services to be ready..."
sleep 15

# Function to check if a service is healthy
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        print_status "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "$service_name may not be fully ready yet"
    return 1
}

# Check service health
print_status "🔍 Checking service health..."
check_service "Application" "$ACCESS_URL/health"
check_service "Prometheus" "http://localhost:$PROMETHEUS_PORT/-/healthy"
check_service "Grafana" "http://localhost:$GRAFANA_PORT/api/health"

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
print_status "📋 Service URLs:"
print_status "  🌐 Application:        $ACCESS_URL"
print_status "  📊 Prometheus:         http://localhost:$PROMETHEUS_PORT"
print_status "  📈 Grafana:            http://localhost:$GRAFANA_PORT"
print_status "  🖥️  Node Exporter:      http://localhost:$NODE_EXPORTER_PORT"

echo ""
print_status "🔐 Grafana Login:"
print_status "  Username: admin"
print_status "  Password: admin123"

# Show container status
echo ""
print_status "📦 Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep pawsistente

# Show resource usage
echo ""
print_status "💻 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep pawsistente

echo ""
print_status "🛠️  Management commands:"
print_status "  Stop all services:"
print_status "    docker stop $APP_CONTAINER $PROMETHEUS_CONTAINER $GRAFANA_CONTAINER $NODE_EXPORTER_CONTAINER"
print_status "  Remove all services:"
print_status "    docker rm $APP_CONTAINER $PROMETHEUS_CONTAINER $GRAFANA_CONTAINER $NODE_EXPORTER_CONTAINER"
print_status "  View logs:"
print_status "    docker logs -f $APP_CONTAINER"
print_status "    docker logs -f $GRAFANA_CONTAINER"
print_status "  Access admin stats:"
print_status "    npm run admin:stats"

echo ""
print_status "📁 CSV File Management:"
print_status "  Update access codes:"
print_status "    nano static/access_codes.csv"
print_status "    # Then restart container: docker restart $APP_CONTAINER"
print_status "  Update schedule:"
print_status "    nano static/schedule.csv"
print_status "    # Then restart container: docker restart $APP_CONTAINER"
print_status "  CSV files are mounted from host - no rebuild needed!"

echo ""
print_status "Platform: $CURRENT_PLATFORM"
print_status "Deployment completed at: $(date)"
print_success "🚀 Pawsistente is ready for production!"
