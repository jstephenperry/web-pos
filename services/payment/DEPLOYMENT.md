# Payment Service - Docker & Keycloak Deployment Guide

This guide covers deploying the Payment Service using Docker with Keycloak as the identity provider.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Web Client    │────▶│   Keycloak   │────▶│ Payment Service │
│  (Port 3000)    │     │  (Port 8180) │     │   (Port 8080)   │
└─────────────────┘     └──────────────┘     └─────────────────┘
                              │                        │
                              │                        │
                              ▼                        ▼
                        ┌──────────┐            ┌──────────┐
                        │ Keycloak │            │ Payment  │
                        │    DB    │            │    DB    │
                        │(Port 5433)│           │(Port 5432)│
                        └──────────┘            └──────────┘
```

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM available for containers
- Ports available: 8080, 8180, 5432, 5433

## Quick Start

### 1. Start All Services

```bash
cd payment-service
docker-compose up -d
```

This starts:
- **Payment Service** (http://localhost:8080/api)
- **Keycloak** (http://localhost:8180)
- **PostgreSQL** (payment-db on 5432, keycloak-db on 5433)

### 2. Wait for Services to be Ready

```bash
# Check all services are healthy
docker-compose ps

# Follow logs
docker-compose logs -f payment-service
```

Wait until you see: "Started PaymentServiceApplication"

### 3. Configure Keycloak

#### Option A: Import Realm Configuration (Recommended)

1. Open Keycloak Admin Console: http://localhost:8180
2. Login with credentials:
   - Username: `admin`
   - Password: `admin`
3. Click "Create Realm" → "Browse" → Select `keycloak/payment-realm.json`
4. Click "Create"

This automatically creates:
- Realm: `payment-realm`
- Roles: `payment-user`, `payment-admin`
- Clients: `payment-service`, `payment-web-app`, `payment-postman`
- Test users: `payment-user` / `payment-admin`

#### Option B: Manual Configuration

1. **Create Realm**
   - Name: `payment-realm`

2. **Create Roles**
   - Go to Realm Roles → Create Role
   - Create: `payment-user`, `payment-admin`

3. **Create Client (payment-service)**
   - Client ID: `payment-service`
   - Client Protocol: `openid-connect`
   - Access Type: `bearer-only`
   - Valid Redirect URIs: Leave empty for bearer-only

4. **Create Client (payment-web-app)**
   - Client ID: `payment-web-app`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`, `http://localhost:8080/*`
   - Web Origins: `http://localhost:3000`, `http://localhost:8080`
   - Direct Access Grants: `ON`

5. **Create Users**
   - Username: `payment-user`, Password: `password123`
   - Assign role: `payment-user`

## Testing the Deployment

### 1. Get Access Token

```bash
# Replace with your Keycloak credentials
curl -X POST http://localhost:8180/realms/payment-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=payment-web-app" \
  -d "client_secret=payment-web-app-secret" \
  -d "username=payment-user" \
  -d "password=password123" \
  -d "grant_type=password"
```

Extract the `access_token` from the response.

### 2. Make Authenticated Request

```bash
# Replace YOUR_TOKEN with the access token from above
TOKEN="YOUR_TOKEN"

# Test payment endpoint
curl -X POST http://localhost:8080/api/v1/payments \
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
    "savePaymentMethod": true
  }'
```

### 3. Test Tokenization

```bash
curl -X POST http://localhost:8080/api/v1/tokens \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer123",
    "cardDetails": {
      "cardNumber": "4532015112830366",
      "cardholderName": "John Doe",
      "expiryMonth": "12",
      "expiryYear": "2027",
      "cvv": "123"
    }
  }'
```

## Environment Profiles

### Development Profile

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Features:
- Debug port exposed (5005)
- Verbose logging
- Hot reload enabled

### Production Configuration

Update `docker-compose.yml` environment variables:

```yaml
environment:
  SPRING_PROFILES_ACTIVE: prod
  DATABASE_URL: jdbc:postgresql://production-db-host:5432/paymentdb
  KEYCLOAK_ISSUER_URI: https://keycloak.production.com/realms/payment-realm
  # Add production secrets
```

## Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f payment-service
docker-compose logs -f keycloak
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart payment-service
```

### Stop Services

```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

### Rebuild Payment Service

```bash
# After code changes
docker-compose build payment-service
docker-compose up -d payment-service
```

### Access Database

```bash
# Payment database
docker exec -it payment-db psql -U paymentuser -d paymentdb

# Keycloak database
docker exec -it keycloak-db psql -U keycloak -d keycloak
```

### Scale Services

```bash
# Run multiple payment service instances
docker-compose up -d --scale payment-service=3
```

## Default Credentials

### Keycloak Admin Console
- URL: http://localhost:8180
- Username: `admin`
- Password: `admin`

### Test Users (after realm import)

**Payment User:**
- Username: `payment-user`
- Password: `password123`
- Role: `payment-user`

**Payment Admin:**
- Username: `payment-admin`
- Password: `admin123`
- Roles: `payment-admin`, `payment-user`

### Database Connections

**Payment Database:**
- Host: `localhost:5432`
- Database: `paymentdb`
- Username: `paymentuser`
- Password: `paymentpass`

**Keycloak Database:**
- Host: `localhost:5433`
- Database: `keycloak`
- Username: `keycloak`
- Password: `keycloakpass`

## Keycloak Client Secrets

Located in Keycloak Admin Console → Clients → [Client Name] → Credentials

**Default Secrets:**
- `payment-service`: `payment-service-secret`
- `payment-web-app`: `payment-web-app-secret`
- `payment-postman`: `payment-postman-secret`

⚠️ **Change these in production!**

## Health Checks

```bash
# Payment Service
curl http://localhost:8080/api/actuator/health

# Keycloak
curl http://localhost:8180/health/ready
```

## Troubleshooting

### Payment Service Won't Start

**Check Keycloak is ready:**
```bash
curl http://localhost:8180/health/ready
```

**Check logs:**
```bash
docker-compose logs payment-service
```

### 401 Unauthorized Errors

1. Verify token is valid:
```bash
echo $TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq
```

2. Check roles in token claims:
```json
{
  "realm_access": {
    "roles": ["payment-user"]
  }
}
```

3. Verify Keycloak connectivity from container:
```bash
docker exec payment-service wget -qO- http://keycloak:8080/realms/payment-realm
```

### Database Connection Issues

```bash
# Test payment database
docker exec payment-db pg_isready -U paymentuser -d paymentdb

# View payment service environment
docker exec payment-service env | grep DATABASE
```

### Token Validation Failures

Ensure `issuer-uri` and `jwk-set-uri` are correct:

```yaml
# For internal container communication
KEYCLOAK_ISSUER_URI: http://keycloak:8080/realms/payment-realm

# For external clients
KEYCLOAK_AUTH_SERVER_URL: http://localhost:8180
```

## Security Best Practices

### Production Deployment

1. **Use HTTPS/TLS**
```yaml
keycloak:
  environment:
    KC_HTTPS_CERTIFICATE_FILE: /path/to/cert.pem
    KC_HTTPS_CERTIFICATE_KEY_FILE: /path/to/key.pem
```

2. **Change Default Passwords**
```bash
# Keycloak admin
KEYCLOAK_ADMIN_PASSWORD: <strong-password>

# Database passwords
POSTGRES_PASSWORD: <strong-password>
```

3. **Use Secrets Management**
```bash
# Docker secrets
echo "strong-password" | docker secret create db_password -
```

4. **Limit Network Exposure**
```yaml
services:
  keycloak-db:
    # Remove ports exposure for internal services
    # ports:
    #   - "5433:5432"
```

5. **Enable SSL for PostgreSQL**
```yaml
payment-db:
  environment:
    POSTGRES_SSL_MODE: require
```

## Monitoring

### Prometheus Metrics

Payment Service exposes metrics at:
```
http://localhost:8080/api/actuator/metrics
```

Keycloak metrics:
```
http://localhost:8180/metrics
```

### Container Stats

```bash
docker stats payment-service keycloak payment-db keycloak-db
```

## Backup & Restore

### Database Backup

```bash
# Backup payment database
docker exec payment-db pg_dump -U paymentuser paymentdb > backup.sql

# Restore
docker exec -i payment-db psql -U paymentuser paymentdb < backup.sql
```

### Keycloak Backup

```bash
# Export realm
docker exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/keycloak-export --realm payment-realm
```

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## Support

For issues or questions, check:
1. Container logs: `docker-compose logs`
2. Health endpoints
3. Keycloak event logs in Admin Console
