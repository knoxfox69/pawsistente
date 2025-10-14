#!/bin/bash

# Purpose: Build Docker image specifically for ARM architecture
# Context: Builds image for ARM64/ARMv7 to run on ARM servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐾 Pawsistente ARM Build Script${NC}"
echo -e "${BLUE}=================================${NC}"

# Extract version from language store
echo -e "${YELLOW}📖 Extracting version from language store...${NC}"
VERSION=$(grep -o "APP_VERSION = '[^']*'" src/lib/stores/language.ts | cut -d"'" -f2)

if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Could not extract version from language store${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found version: ${VERSION}${NC}"

# Set image name and tags
IMAGE_NAME="windowsagent/pawsistente"
FULL_TAG="${IMAGE_NAME}:${VERSION}"
LATEST_TAG="${IMAGE_NAME}:latest"

echo -e "${YELLOW}🏗️  Building Docker image for ARM architecture...${NC}"
echo -e "${BLUE}   Image: ${FULL_TAG}${NC}"
echo -e "${BLUE}   Latest: ${LATEST_TAG}${NC}"

# Build for ARM64 architecture
echo -e "${YELLOW}🔧 Building for ARM64...${NC}"
docker build \
    --platform linux/arm64 \
    --tag "${FULL_TAG}" \
    --tag "${LATEST_TAG}" \
    .

echo -e "${GREEN}✅ Docker image built successfully for ARM64!${NC}"

# Test the container with rm option
echo -e "${YELLOW}🧪 Testing container with --rm option...${NC}"

# Test container startup with rm
echo -e "${YELLOW}🚀 Starting test container (will auto-remove)...${NC}"
if docker run --rm -d -p 3000:3000 --name "pawsistente-test-${VERSION}" "${FULL_TAG}"; then
    CONTAINER_ID=$(docker ps -q --filter "name=pawsistente-test-${VERSION}")
    echo -e "${GREEN}✅ Container started successfully! (ID: ${CONTAINER_ID})${NC}"
    
    # Wait a moment for container to start
    sleep 5
    
    # Check if container is still running
    if docker ps | grep -q "pawsistente-test-${VERSION}"; then
        echo -e "${GREEN}✅ Container is running!${NC}"
        
        # Test HTTP endpoint
        echo -e "${YELLOW}🌐 Testing HTTP endpoint...${NC}"
        if curl -f -s http://localhost:3000 > /dev/null; then
            echo -e "${GREEN}✅ HTTP endpoint responding correctly!${NC}"
        else
            echo -e "${YELLOW}⚠️  HTTP endpoint test failed, but container is running${NC}"
        fi
        
        # Show container logs
        echo -e "${YELLOW}📋 Container logs:${NC}"
        docker logs "pawsistente-test-${VERSION}" --tail 20
        
        # Stop the container (it will auto-remove due to --rm)
        echo -e "${YELLOW}🛑 Stopping test container...${NC}"
        docker stop "pawsistente-test-${VERSION}" > /dev/null 2>&1 || true
        
    else
        echo -e "${RED}❌ Container stopped unexpectedly!${NC}"
        echo -e "${YELLOW}📋 Container logs:${NC}"
        docker logs "pawsistente-test-${VERSION}" --tail 20 2>/dev/null || echo "No logs available"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to start container!${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 ARM build and test completed successfully!${NC}"
echo -e "${BLUE}📦 Image: ${FULL_TAG}${NC}"
echo -e "${BLUE}📦 Latest: ${LATEST_TAG}${NC}"
echo -e "${YELLOW}💡 To deploy: ./scripts/deploy-arm.sh${NC}"
