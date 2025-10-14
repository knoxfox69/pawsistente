#!/bin/bash

# Purpose: Deploy ARM Docker image to registry
# Context: Pushes the ARM-built image to windowsagent/pawsistente:v{version}

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pawsistente ARM Deploy Script${NC}"
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
VERSION_TAG="${IMAGE_NAME}:${VERSION}"
LATEST_TAG="${IMAGE_NAME}:latest"

# Check if Docker is logged in
echo -e "${YELLOW}🔐 Checking Docker login status...${NC}"
if ! docker info | grep -q "Username:"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub. Please login first:${NC}"
    echo -e "${BLUE}   docker login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker login verified${NC}"

# Check if image exists locally
echo -e "${YELLOW}🔍 Checking if image exists locally...${NC}"
if ! docker image inspect "${VERSION_TAG}" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Image ${VERSION_TAG} not found locally${NC}"
    echo -e "${BLUE}💡 Run ./scripts/build-arm.sh first to build the image${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Image found locally: ${VERSION_TAG}${NC}"

# Show image architecture info
echo -e "${YELLOW}🏗️  Image architecture info:${NC}"
docker image inspect "${VERSION_TAG}" | grep -E '"Architecture"|"Os"' || echo "Architecture info not available"

# Tag for latest if this is not a pre-release
if [[ ! "$VERSION" =~ (alpha|beta|rc) ]]; then
    echo -e "${YELLOW}🏷️  Tagging as latest (not a pre-release)...${NC}"
    docker tag "${VERSION_TAG}" "${LATEST_TAG}"
    LATEST_EXISTS=true
else
    echo -e "${YELLOW}ℹ️  Skipping latest tag (pre-release version)${NC}"
    LATEST_EXISTS=false
fi

# Push version tag
echo -e "${YELLOW}📤 Pushing version tag: ${VERSION_TAG}${NC}"
docker push "${VERSION_TAG}"

echo -e "${GREEN}✅ Version tag pushed successfully!${NC}"

# Push latest tag if it exists
if [ "$LATEST_EXISTS" = true ]; then
    echo -e "${YELLOW}📤 Pushing latest tag: ${LATEST_TAG}${NC}"
    docker push "${LATEST_TAG}"
    echo -e "${GREEN}✅ Latest tag pushed successfully!${NC}"
fi

# Show deployment summary
echo -e "${GREEN}🎉 ARM deployment completed successfully!${NC}"
echo -e "${BLUE}📦 Deployed images:${NC}"
echo -e "${BLUE}   ${VERSION_TAG} (ARM64)${NC}"
if [ "$LATEST_EXISTS" = true ]; then
    echo -e "${BLUE}   ${LATEST_TAG} (ARM64)${NC}"
fi

# Show pull commands
echo -e "${YELLOW}💡 Pull commands:${NC}"
echo -e "${BLUE}   docker pull ${VERSION_TAG}${NC}"
if [ "$LATEST_EXISTS" = true ]; then
    echo -e "${BLUE}   docker pull ${LATEST_TAG}${NC}"
fi

# Show run commands
echo -e "${YELLOW}🚀 Run commands:${NC}"
echo -e "${BLUE}   docker run -d -p 3000:3000 --name pawsistente ${VERSION_TAG}${NC}"
if [ "$LATEST_EXISTS" = true ]; then
    echo -e "${BLUE}   docker run -d -p 3000:3000 --name pawsistente ${LATEST_TAG}${NC}"
fi

echo -e "${GREEN}✨ Happy deploying on ARM! 🐾${NC}"
