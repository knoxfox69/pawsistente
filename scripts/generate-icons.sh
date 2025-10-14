#!/bin/bash

# Purpose: Generate all required icon sizes from favicon.ico
# Context: Creates Apple touch icons, Android icons, and other required sizes for PWA

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎨 Generating icons for Pawsistente...${NC}"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}❌ ImageMagick is not installed. Please install it first:${NC}"
    echo "  - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  - macOS: brew install imagemagick"
    echo "  - Alpine: apk add imagemagick"
    exit 1
fi

# Check if favicon.ico exists
if [ ! -f "static/favicon.ico" ]; then
    echo -e "${RED}❌ favicon.ico not found in static/ directory${NC}"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p static/icons

echo -e "${YELLOW}📱 Generating Apple Touch Icons...${NC}"
# Apple Touch Icons
convert static/favicon.ico -resize 180x180 static/apple-touch-icon.png
convert static/favicon.ico -resize 152x152 static/apple-touch-icon-152x152.png
convert static/favicon.ico -resize 120x120 static/apple-touch-icon-120x120.png
convert static/favicon.ico -resize 76x76 static/apple-touch-icon-76x76.png
convert static/favicon.ico -resize 60x60 static/apple-touch-icon-60x60.png

echo -e "${YELLOW}🤖 Generating Android Icons...${NC}"
# Android Chrome Icons
convert static/favicon.ico -resize 192x192 static/android-chrome-192x192.png
convert static/favicon.ico -resize 512x512 static/android-chrome-512x512.png

echo -e "${YELLOW}🌐 Generating Web Icons...${NC}"
# Web Icons
convert static/favicon.ico -resize 32x32 static/favicon-32x32.png
convert static/favicon.ico -resize 16x16 static/favicon-16x16.png

# Create a high-quality favicon.ico with multiple sizes
echo -e "${YELLOW}🔗 Creating multi-size favicon.ico...${NC}"
convert static/favicon.ico -resize 16x16 static/icons/favicon-16x16.png
convert static/favicon.ico -resize 32x32 static/icons/favicon-32x32.png
convert static/favicon.ico -resize 48x48 static/icons/favicon-48x48.png

# Create a new favicon.ico with multiple sizes
convert static/icons/favicon-16x16.png static/icons/favicon-32x32.png static/icons/favicon-48x48.png static/favicon.ico

echo -e "${YELLOW}📋 Generating site.webmanifest...${NC}"
# Create site.webmanifest
cat > static/site.webmanifest << EOF
{
  "name": "🐾 Pawsistente - Confuror Calendar",
  "short_name": "Pawsistente",
  "description": "Plan your perfect schedule for Confuror 2025! Swipe, select, and sync with your favorite calendar app.",
  "start_url": "/",
  "id": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#111827",
  "theme_color": "#3B82F6",
  "categories": ["productivity", "calendar", "events"],
  "icons": [
    {
      "src": "/favicon-16x16.png",
      "sizes": "16x16",
      "type": "image/png"
    },
    {
      "src": "/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Browse Events",
      "url": "/events",
      "description": "Browse and select Confuror events"
    }
  ]
}
EOF

echo -e "${GREEN}✅ All icons generated successfully!${NC}"
echo -e "${GREEN}📁 Generated files:${NC}"
echo "  - apple-touch-icon.png (180x180)"
echo "  - apple-touch-icon-152x152.png"
echo "  - apple-touch-icon-120x120.png"
echo "  - apple-touch-icon-76x76.png"
echo "  - apple-touch-icon-60x60.png"
echo "  - android-chrome-192x192.png"
echo "  - android-chrome-512x512.png"
echo "  - favicon-16x16.png"
echo "  - favicon-32x32.png"
echo "  - site.webmanifest"

echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Update your app.html to reference the new icons"
echo "  2. Test the build: npm run build"
echo "  3. Deploy and test on mobile devices"
