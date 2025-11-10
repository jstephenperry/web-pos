#!/bin/bash

# Script to obtain Keycloak access token for testing
# Usage: ./scripts/get-token.sh [username] [password]

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8180}"
REALM="${REALM:-payment-realm}"
CLIENT_ID="${CLIENT_ID:-payment-web-app}"
CLIENT_SECRET="${CLIENT_SECRET:-payment-web-app-secret}"
USERNAME="${1:-payment-user}"
PASSWORD="${2:-password123}"

echo "Requesting token for user: $USERNAME"
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo ""

RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET" \
  -d "username=$USERNAME" \
  -d "password=$PASSWORD" \
  -d "grant_type=password")

# Check if jq is available
if command -v jq &> /dev/null; then
  ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.access_token')

  if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "✓ Access Token obtained successfully!"
    echo ""
    echo "Export to environment:"
    echo "export TOKEN='$ACCESS_TOKEN'"
    echo ""
    echo "Or use directly:"
    echo "curl -H \"Authorization: Bearer $ACCESS_TOKEN\" http://localhost:8080/api/v1/payments/health"
    echo ""

    # Decode token payload
    echo "Token Claims:"
    echo "$ACCESS_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq '.' 2>/dev/null || echo "Unable to decode token"
  else
    echo "✗ Failed to obtain token"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  fi
else
  # Fallback without jq
  echo "Response:"
  echo "$RESPONSE"
  echo ""
  echo "Note: Install 'jq' for better formatting"
fi
