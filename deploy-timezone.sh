#!/bin/bash

# Timezone Implementation Deployment Script
# This script deploys the comprehensive timezone implementation for Pearson Pub

echo "🕐 Starting Timezone Implementation Deployment"
echo "=============================================="

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

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        print_success "$1"
    else
        print_error "$1 failed"
        exit 1
    fi
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the pearson_pub_backend directory"
    exit 1
fi

print_status "Verifying environment..."

# Check if .develop.env exists
if [ ! -f ".develop.env" ]; then
    print_error ".develop.env file not found. Please create it with database credentials."
    exit 1
fi

print_success "Environment file found"

# Install dependencies
print_status "Installing dependencies..."
npm install
check_status "Dependencies installed"

# Build the project
print_status "Building the project..."
npm run build
check_status "Project built successfully"

# Show current migration status
print_status "Checking current migration status..."
npm run migration:show

# Run the timezone migration
print_status "Running timezone migration..."
npm run migration:run
check_status "Migration completed successfully"

# Verify the migration
print_status "Verifying migration results..."
npm run migration:show

# Test the timezone implementation
print_status "Testing timezone implementation..."
npx ts-node test-timezone-comprehensive.ts
check_status "Timezone tests passed"

# Start the application in development mode
print_status "Starting the application..."
print_warning "The application will start in development mode."
print_warning "Press Ctrl+C to stop the application when ready."
print_warning "Test the following endpoints:"
print_warning "  - GET /operation-hours/status (current operation status)"
print_warning "  - GET /public-api/landing-page-data (timezone-aware data)"
print_warning "  - GET /events (timezone-aware events)"

echo ""
print_success "Timezone implementation deployment completed!"
print_success "All timestamps now use America/Toronto timezone consistently."
echo ""

# Optional: Start the development server
read -p "Start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run start:dev
fi
