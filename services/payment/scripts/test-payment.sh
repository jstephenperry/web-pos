#!/bin/bash

# Script to test payment API with authentication
# Usage: ./scripts/test-payment.sh [access-token]

API_URL="${API_URL:-http://localhost:8080/api}"
TOKEN="${1:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: Access token required"
  echo "Usage: $0 <access-token>"
  echo ""
  echo "Get token first with:"
  echo "  ./scripts/get-token.sh"
  exit 1
fi

echo "Testing Payment API..."
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check (no auth required)
echo "1. Health Check (Public)"
curl -s "$API_URL/v1/payments/health" | jq '.' 2>/dev/null || curl -s "$API_URL/v1/payments/health"
echo ""
echo ""

# Test 2: Process Payment
echo "2. Process Payment (Requires Auth)"
curl -s -X POST "$API_URL/v1/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer123",
    "amount": 99.99,
    "currency": "USD",
    "cardDetails": {
      "cardNumber": "4532015112830366",
      "cardholderName": "John Doe",
      "expiryMonth": "12",
      "expiryYear": "2027",
      "cvv": "123",
      "billingZip": "12345"
    },
    "orderId": "order456",
    "savePaymentMethod": true,
    "description": "Test payment from script"
  }' | jq '.' 2>/dev/null

echo ""
echo ""

# Test 3: Tokenize Card
echo "3. Tokenize Payment Method (Requires Auth)"
curl -s -X POST "$API_URL/v1/tokens" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer123",
    "cardDetails": {
      "cardNumber": "4532015112830366",
      "cardholderName": "Jane Smith",
      "expiryMonth": "06",
      "expiryYear": "2028",
      "cvv": "456",
      "billingZip": "67890"
    }
  }' | jq '.' 2>/dev/null

echo ""
echo ""
echo "✓ Tests completed"
