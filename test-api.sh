#!/bin/bash

echo "Testing API endpoints..."
echo ""

echo "1. Testing API root:"
curl -s http://localhost/api/ | jq .
echo ""

echo "2. Testing API auth endpoint:"
curl -X POST http://localhost/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@example.com","password":"admin123"}' \
  -s | jq .
echo ""

echo "3. Testing direct index.php:"
curl -s http://localhost/api/index.php | jq .
echo ""

