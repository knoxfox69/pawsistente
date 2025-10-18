#!/bin/bash

# Purpose: Helper script to update CSV files and restart the application
# Context: Makes it easy to update access codes or schedule without full redeploy

set -e

echo "📁 CSV File Management Helper"

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

# Check if container is running
if ! docker ps -q -f name="pawsistente-prod" > /dev/null 2>&1; then
    print_error "Main application container 'pawsistente-prod' is not running."
    print_status "Please run ./scripts/deploy.sh first."
    exit 1
fi

# Function to edit and restart
edit_and_restart() {
    local file=$1
    local description=$2
    
    print_status "Editing $description..."
    print_status "File: static/$file"
    
    # Check if file exists
    if [ ! -f "static/$file" ]; then
        print_error "File static/$file not found!"
        return 1
    fi
    
    # Show current content
    echo ""
    print_status "Current content of $file:"
    echo "----------------------------------------"
    cat "static/$file"
    echo "----------------------------------------"
    echo ""
    
    # Ask if user wants to edit
    read -p "Do you want to edit this file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Try to open with nano, fallback to vi
        if command -v nano > /dev/null 2>&1; then
            nano "static/$file"
        elif command -v vi > /dev/null 2>&1; then
            vi "static/$file"
        else
            print_error "No text editor found. Please edit static/$file manually."
            return 1
        fi
        
        # Restart container to apply changes
        print_status "Restarting application container to apply changes..."
        docker restart pawsistente-prod
        
        if [ $? -eq 0 ]; then
            print_success "$description updated successfully!"
            print_status "Changes are now live."
        else
            print_error "Failed to restart container."
            return 1
        fi
    else
        print_status "No changes made to $file."
    fi
}

# Main menu
echo ""
print_status "Available CSV files:"
print_status "1. Access codes (static/access_codes.csv)"
print_status "2. Schedule (static/schedule.csv)"
print_status "3. View current files"
print_status "4. Exit"
echo ""

read -p "Select option (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        edit_and_restart "access_codes.csv" "Access codes"
        ;;
    2)
        edit_and_restart "schedule.csv" "Schedule"
        ;;
    3)
        print_status "Current CSV files:"
        echo ""
        print_status "Access codes (static/access_codes.csv):"
        echo "----------------------------------------"
        cat static/access_codes.csv
        echo "----------------------------------------"
        echo ""
        print_status "Schedule (static/schedule.csv):"
        echo "----------------------------------------"
        cat static/schedule.csv
        echo "----------------------------------------"
        ;;
    4)
        print_status "Goodbye!"
        exit 0
        ;;
    *)
        print_error "Invalid option. Please select 1-4."
        exit 1
        ;;
esac
