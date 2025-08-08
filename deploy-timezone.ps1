# Timezone Implementation Deployment Script for Windows
# This script deploys the comprehensive timezone implementation for Pearson Pub

Write-Host "🕐 Starting Timezone Implementation Deployment" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Command {
    param([string]$Description)
    if ($LASTEXITCODE -eq 0) {
        Write-Success $Description
    } else {
        Write-Error "$Description failed"
        exit 1
    }
}

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the pearson_pub_backend directory"
    exit 1
}

Write-Status "Verifying environment..."

# Check if .develop.env exists
if (-not (Test-Path ".develop.env")) {
    Write-Error ".develop.env file not found. Please create it with database credentials."
    exit 1
}

Write-Success "Environment file found"

# Install dependencies
Write-Status "Installing dependencies..."
npm install
Test-Command "Dependencies installed"

# Build the project
Write-Status "Building the project..."
npm run build
Test-Command "Project built successfully"

# Show current migration status
Write-Status "Checking current migration status..."
npm run migration:show

# Run the timezone migration
Write-Status "Running timezone migration..."
npm run migration:run
Test-Command "Migration completed successfully"

# Verify the migration
Write-Status "Verifying migration results..."
npm run migration:show

# Test the timezone implementation
Write-Status "Testing timezone implementation..."
npx ts-node test-timezone-comprehensive.ts
Test-Command "Timezone tests passed"

# Display success message
Write-Host ""
Write-Success "Timezone implementation deployment completed!"
Write-Success "All timestamps now use America/Toronto timezone consistently."
Write-Host ""

Write-Warning "Test the following endpoints after starting the application:"
Write-Warning "  - GET /operation-hours/status (current operation status)"
Write-Warning "  - GET /public-api/landing-page-data (timezone-aware data)"
Write-Warning "  - GET /events (timezone-aware events)"
Write-Host ""

# Optional: Start the development server
$response = Read-Host "Start the development server now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Status "Starting development server..."
    npm run start:dev
}
