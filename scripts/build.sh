#!/bin/bash

# Purpose: Build Docker image with version from language store and test it
# Context: Extracts version from language store, builds multi-arch image, and tests container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐾 Pawsistente Docker Build Script${NC}"
echo -e "${BLUE}====================================${NC}"

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

echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
echo -e "${BLUE}   Image: ${FULL_TAG}${NC}"
echo -e "${BLUE}   Latest: ${LATEST_TAG}${NC}"

# Build for multiple architectures to avoid exec format error
echo -e "${YELLOW}🔧 Building multi-architecture image...${NC}"
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --tag "${FULL_TAG}" \
    --tag "${LATEST_TAG}" \
    --push \
    .

echo -e "${GREEN}✅ Docker image built and pushed successfully!${NC}"

# Test the container locally (build for local architecture)
echo -e "${YELLOW}🧪 Testing container locally...${NC}"

# Build local version for testing
LOCAL_TAG="${IMAGE_NAME}:${VERSION}-local"
docker build -t "${LOCAL_TAG}" .

# Test container startup
echo -e "${YELLOW}🚀 Starting test container...${NC}"
CONTAINER_ID=$(docker run -d -p 3000:3000 --name "pawsistente-test-${VERSION}" "${LOCAL_TAG}")

# Wait a moment for container to start
sleep 5

# Check if container is running
if docker ps | grep -q "pawsistente-test-${VERSION}"; then
    echo -e "${GREEN}✅ Container started successfully!${NC}"
    
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
    
else
    echo -e "${RED}❌ Container failed to start!${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker logs "pawsistente-test-${VERSION}" --tail 20
    exit 1
fi

# Cleanup test container
echo -e "${YELLOW}🧹 Cleaning up test container...${NC}"
docker stop "pawsistente-test-${VERSION}" > /dev/null 2>&1 || true
docker rm "pawsistente-test-${VERSION}" > /dev/null 2>&1 || true

# Remove local test image
docker rmi "${LOCAL_TAG}" > /dev/null 2>&1 || true

echo -e "${GREEN}🎉 Build and test completed successfully!${NC}"
echo -e "${BLUE}📦 Image: ${FULL_TAG}${NC}"
echo -e "${BLUE}📦 Latest: ${LATEST_TAG}${NC}"
echo -e "${YELLOW}💡 To deploy: ./scripts/deploy.sh${NC}"
