# Payment and Tokenization Service

A secure Java-based payment processing and tokenization service built with Spring Boot 3, designed for the Web POS system.

## Features

- **Payment Processing**: Authorize, capture, and refund payments
- **Tokenization**: Securely tokenize payment card information using AES-256-GCM encryption
- **PCI DSS Compliant Design**: Sensitive card data is encrypted at rest
- **OAuth2/Keycloak Integration**: Enterprise-grade authentication and authorization
- **Docker Support**: Full containerization with docker-compose
- **Mock Payment Gateway**: Includes a mock gateway for testing (configurable for production gateways)
- **RESTful API**: Clean REST endpoints for payment and token operations
- **Multi-Database Support**: H2 for development, PostgreSQL for production

## Quick Start with Docker

The fastest way to get started is using Docker:

```bash
# Start all services (Payment Service + Keycloak + PostgreSQL)
docker-compose up -d

# Import Keycloak realm configuration
# Open http://localhost:8180 → Login (admin/admin) → Import keycloak/payment-realm.json

# Get access token
./scripts/get-token.sh payment-user password123

# Test the API
./scripts/test-payment.sh <your-access-token>
```

📖 **See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Docker deployment guide**

## Tech Stack

- **Java 21 LTS** (configured for future Java 25 compatibility)
- **Spring Boot 3.4.1**
- **Gradle with Kotlin DSL**
- **Spring Data JPA**
- **Spring Security OAuth2** with Keycloak
- **Google Tink** for encryption
- **Docker & Docker Compose**
- **PostgreSQL** (production) / **H2** (development)

## Project Structure

```
payment-service/
├── src/main/java/dev/jstephenperry/webpos/payment/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── dto/            # Data Transfer Objects
│   ├── exception/      # Custom exceptions
│   ├── model/          # JPA entities
│   ├── repository/     # Spring Data repositories
│   ├── service/        # Business logic services
│   └── PaymentServiceApplication.java
└── src/main/resources/
    ├── application.yml          # Main configuration
    ├── application-dev.yml      # Development profile
    └── application-prod.yml     # Production profile
```

## Getting Started

### Option 1: Docker (Recommended)

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

```bash
docker-compose up -d
```

### Option 2: Local Development

#### Prerequisites

- Java 21 or later
- Gradle 8.x (or use included wrapper)

#### Build

```bash
./gradlew build
```

### Run

```bash
./gradlew bootRun
```

The service will start on port 8080 by default. Access the API at `http://localhost:8080/api`

### Run with specific profile

```bash
./gradlew bootRun --args='--spring.profiles.active=dev'
```

## API Endpoints

### Payment Operations

- `POST /api/v1/payments` - Process a new payment
- `POST /api/v1/payments/{paymentId}/capture` - Capture an authorized payment
- `POST /api/v1/payments/{paymentId}/refund` - Refund a payment
- `GET /api/v1/payments/transaction/{transactionId}` - Get payment by transaction ID
- `GET /api/v1/payments/customer/{customerId}` - Get all payments for a customer

### Tokenization Operations

- `POST /api/v1/tokens` - Tokenize payment information
- `DELETE /api/v1/tokens/{token}` - Revoke a token
- `GET /api/v1/tokens/customer/{customerId}` - Get all tokens for a customer

### Health Check

- `GET /api/v1/payments/health` - Payment service health
- `GET /api/v1/tokens/health` - Tokenization service health

## Example Requests

### Process Payment

```bash
curl -X POST http://localhost:8080/api/v1/payments \
  -u admin:changeme \
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

### Tokenize Payment Method

```bash
curl -X POST http://localhost:8080/api/v1/tokens \
  -u admin:changeme \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer123",
    "cardDetails": {
      "cardNumber": "4532015112830366",
      "cardholderName": "John Doe",
      "expiryMonth": "12",
      "expiryYear": "2027",
      "cvv": "123",
      "billingZip": "12345"
    }
  }'
```

## Configuration

Key configuration properties in `application.yml`:

- `server.port`: Server port (default: 8080)
- `spring.datasource.*`: Database configuration
- `payment.tokenization.*`: Tokenization settings
- `payment.processor.*`: Payment processor settings

## Security

- HTTP Basic Authentication (configure Spring Security credentials)
- Encryption using AES-256-GCM via Google Tink
- CORS configured for localhost development
- All sensitive card data is encrypted before storage

**Production Recommendations:**
- Use OAuth2 or JWT for authentication
- Store encryption keys in a secure key management service (AWS KMS, HashiCorp Vault, etc.)
- Enable HTTPS/TLS
- Implement rate limiting
- Use a production-grade database (PostgreSQL)
- Follow PCI DSS compliance guidelines

## Development

### H2 Console

When running in dev profile, access the H2 console at:
```
http://localhost:8080/api/h2-console
```

- JDBC URL: `jdbc:h2:mem:paymentdb`
- Username: `sa`
- Password: (leave blank)

## Testing

```bash
./gradlew test
```

## Package

```bash
./gradlew bootJar
```

The JAR file will be created in `build/libs/`

## License

Copyright (c) 2025 JStephenPerry
