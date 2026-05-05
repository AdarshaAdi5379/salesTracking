#!/bin/bash

# Start PHP Backend Server for Edubricz Sales Tracking

echo "Starting PHP Backend Server..."
echo "Server will be available at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")/backend"
# Increase upload limits for photo uploads (mobile/admin can upload up to 5MB).
# Defaults are often too low (e.g. upload_max_filesize=2M).
php \
  -d upload_max_filesize=10M \
  -d post_max_size=12M \
  -S localhost:8000 -t api
