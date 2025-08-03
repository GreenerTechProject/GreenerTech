#!/bin/bash

# Check for -v flag
if [ "$1" == "-v" ]; then
    echo "🧹 Removing volumes..."
    docker-compose down -v
else
    docker-compose down
fi

echo "🚀 Starting containers..."
docker-compose build --no-cache
docker-compose up -d

echo "Launching Python service..."
cd services
python3 services.py