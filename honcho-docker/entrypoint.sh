#!/bin/bash
set -e

echo "Starting Honcho process manager..."

# Set Python path
export PYTHONPATH=/app:$PYTHONPATH
echo "PYTHONPATH set to: $PYTHONPATH"

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if all processes are defined
if [ ! -f Procfile ]; then
    echo "Error: Procfile not found!"
    exit 1
fi

# Wait for Redis if needed
if [ "$ENVIRONMENT" = "production" ] || [ -n "$REDIS_URL" ]; then
    echo "Waiting for Redis..."
    timeout=30
    while ! nc -z redis 6379 2>/dev/null; do
        sleep 1
        ((timeout--))
        if [ $timeout -eq 0 ]; then
            echo "Redis not available, continuing anyway..."
            break
        fi
    done
fi

# Start honcho with all processes
echo "Starting Honcho processes..."
exec honcho start -f Procfile
