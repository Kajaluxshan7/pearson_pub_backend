#!/bin/bash

# Migration script for Docker deployment
# This script runs database migrations with proper error handling and logging

set -e

echo "🚀 Starting database migration process..."

# Determine environment file
if [ "$MIGRATION_MODE" = "true" ]; then
    ENV_FILE=".env"
    echo "📄 Using Docker environment file: $ENV_FILE"
else
    ENV_FILE=".env.development"
    echo "📄 Using development environment file: $ENV_FILE"
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE file not found!"
    echo "Available files:"
    ls -la
    exit 1
fi

# Load environment variables
set -a  # Automatically export all variables
source "$ENV_FILE"
set +a

echo "📊 Database Connection Details:"
echo "Host: ${DB_HOST:-localhost}"
echo "Port: ${DB_PORT:-5432}"
echo "Database: ${DB_DATABASE:-pearson_test}"
echo "User: ${DB_USERNAME:-postgres}"
echo "Migration Mode: ${MIGRATION_MODE:-false}"
echo "Node Environment: ${NODE_ENV:-development}"

# Function to check if PostgreSQL client is available
check_pg_client() {
    if ! command -v pg_isready &> /dev/null; then
        echo "⚠️ pg_isready not found, skipping database readiness check"
        return 0
    fi
    return 1
}

# Wait for database to be ready (if pg_isready is available)
if ! check_pg_client; then
    echo "⏳ Waiting for database to be ready..."
    max_attempts=30
    attempt=0

    until pg_isready -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" > /dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Database is not ready after $max_attempts attempts"
            echo "💡 Continuing anyway as database might be ready but pg_isready failed"
            break
        fi
        echo "⏳ Waiting for database... ($attempt/$max_attempts)"
        sleep 2
    done

    if [ $attempt -lt $max_attempts ]; then
        echo "✅ Database is ready!"
    fi
else
    echo "⏳ Waiting 10 seconds for database to be ready..."
    sleep 10
fi

# Show current working directory and files
echo "📍 Current directory: $(pwd)"
echo "📂 Available files:"
ls -la

# Check for required files
echo "🔍 Checking required files..."
if [ -f "data-source.ts" ]; then
    echo "✅ data-source.ts found"
else
    echo "❌ data-source.ts not found"
    exit 1
fi

if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

# Check migration directory
if [ -d "src/migrations" ]; then
    echo "✅ Migration directory found"
    echo "📂 Migration files:"
    ls -la src/migrations/ || echo "No migration files found"
else
    echo "📁 Creating migration directory..."
    mkdir -p src/migrations
fi

# Show current migration status
echo "📋 Current migration status:"
if npm run migration:show; then
    echo "✅ Migration status retrieved successfully"
else
    echo "⚠️ Could not retrieve migration status"
fi

# Run TypeORM migrations
echo "🔄 Running database migrations..."
if npm run migration:run; then
    echo "✅ Migrations completed successfully!"
    
    # Show final migration status
    echo "📊 Final migration status:"
    npm run migration:show || echo "⚠️ Could not show final status"
else
    echo "❌ Migration failed!"
    echo "📝 Debugging information:"
    echo "Environment variables:"
    env | grep -E "^(DB_|NODE_|MIGRATION_)" || echo "No relevant env vars found"
    exit 1
fi

echo "🎉 Migration process completed successfully!"
