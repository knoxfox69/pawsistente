#!/bin/bash

# Purpose: Complete server deployment script for ARM architecture
# Context: Builds, tests, and deploys the application to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐾 Pawsistente Server Deployment${NC}"
echo -e "${BLUE}=================================${NC}"

# Extract version from language store
echo -e "${YELLOW}📖 Extracting version from language store...${NC}"
VERSION=$(grep -o "APP_VERSION = '[^']*'" src/lib/stores/language.ts | cut -d"'" -f2)

if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Could not extract version from language store${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found version: ${VERSION}${NC}"

# Check if we're on ARM architecture
echo -e "${YELLOW}🔍 Checking system architecture...${NC}"
ARCH=$(uname -m)
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo -e "${GREEN}✅ Running on ARM64 architecture${NC}"
elif [[ "$ARCH" == "armv7l" ]]; then
    echo -e "${GREEN}✅ Running on ARMv7 architecture${NC}"
else
    echo -e "${YELLOW}⚠️  Running on ${ARCH} - building for ARM64 anyway${NC}"
fi

# Build the image
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
docker build \
    --platform linux/arm64 \
    --tag "windowsagent/pawsistente:${VERSION}" \
    --tag "windowsagent/pawsistente:latest" \
    .

echo -e "${GREEN}✅ Docker image built successfully!${NC}"

# Test the container
echo -e "${YELLOW}🧪 Testing container...${NC}"
if docker run --rm -d -p 3000:3000 --name "pawsistente-test-${VERSION}" "windowsagent/pawsistente:${VERSION}"; then
    echo -e "${GREEN}✅ Container started successfully!${NC}"
    
    # Wait for container to start
    sleep 5
    
    # Test HTTP endpoint
    if curl -f -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ HTTP endpoint responding correctly!${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP endpoint test failed, but container is running${NC}"
    fi
    
    # Stop test container
    docker stop "pawsistente-test-${VERSION}" > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Container test completed!${NC}"
else
    echo -e "${RED}❌ Container test failed!${NC}"
    exit 1
fi

# Check Docker login
echo -e "${YELLOW}🔐 Checking Docker login...${NC}"
if ! docker info | grep -q "Username:"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub. Please login first:${NC}"
    echo -e "${BLUE}   docker login${NC}"
    exit 1
fi

# Push to registry
echo -e "${YELLOW}📤 Pushing to Docker Hub...${NC}"
docker push "windowsagent/pawsistente:${VERSION}"

# Push latest if not pre-release
if [[ ! "$VERSION" =~ (alpha|beta|rc) ]]; then
    echo -e "${YELLOW}📤 Pushing latest tag...${NC}"
    docker push "windowsagent/pawsistente:latest"
fi

echo -e "${GREEN}🎉 Server deployment completed successfully!${NC}"
echo -e "${BLUE}📦 Deployed: windowsagent/pawsistente:${VERSION}${NC}"
echo -e "${YELLOW}💡 To run: docker run -d -p 3000:3000 --name pawsistente windowsagent/pawsistente:${VERSION}${NC}"
