#!/bin/bash

# Start PHP Backend Server for Edubricz Sales Tracking

echo "Starting PHP Backend Server..."
echo "Server will be available at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")/backend"
php -S localhost:8000 -t api

