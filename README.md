# Web POS - Monorepo

A modern, microservices-based Point of Sale system built with a modular monorepo architecture.

## 🏗️ Architecture

This monorepo contains all components of the Web POS system, organized for independent deployment and development:

```
web-pos/
├── apps/
│   └── web-frontend/          # Next.js 15 web application
├── services/
│   └── payment/               # Java Spring Boot payment service
├── packages/
│   └── shared-types/          # Shared TypeScript types
├── infrastructure/
│   └── docker/                # Infrastructure configurations
├── docker-compose.yml         # Multi-container orchestration
└── docker-compose.dev.yml     # Development overrides
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop 20.10+
- Docker Compose 2.0+
- Node.js 20+ (for local development)
- Java 21+ (for local development)
- Make (optional, for convenience commands)

### Start All Services

```bash
# Clone the repository
git clone <repository-url>
cd web-pos

# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up -d

# Or use make
make up
```

### Access Services

Once all containers are healthy:

- **Web Frontend**: http://localhost:3000
- **Payment API**: http://localhost:8080/api
- **Keycloak Admin**: http://localhost:8180 (admin/admin)
- **Payment DB**: localhost:5432
- **Keycloak DB**: localhost:5433

### Configure Keycloak

1. Open http://localhost:8180
2. Login with `admin` / `admin`
3. Click "Create Realm"
4. Import `services/payment/keycloak/payment-realm.json`
5. Realm `payment-realm` is now configured with test users

### Test the System

```bash
# Get an access token
cd services/payment
./scripts/get-token.sh payment-user password123

# Test payment API
./scripts/test-payment.sh <your-token>
```

## 📦 Components

### Apps

#### Web Frontend (`apps/web-frontend`)

Next.js 15 web application with:
- React 19
- TypeScript
- Tailwind CSS
- Keycloak integration
- Payment processing UI

**Local Development:**
```bash
cd apps/web-frontend
npm install
npm run dev
```

**Docker Build:**
```bash
docker build -t webpos-frontend ./apps/web-frontend
```

### Services

#### Payment Service (`services/payment`)

Java Spring Boot microservice providing:
- Payment processing (authorize, capture, refund)
- PCI-compliant tokenization with AES-256-GCM
- OAuth2/Keycloak authentication
- RESTful API
- PostgreSQL persistence

**Tech Stack:**
- Java 21 LTS
- Spring Boot 3.4.1
- Spring Security OAuth2
- Google Tink (encryption)
- Gradle Kotlin DSL

**Local Development:**
```bash
cd services/payment
./gradlew bootRun
```

**Docker Build:**
```bash
docker build -t webpos-payment ./services/payment
```

See [services/payment/README.md](services/payment/README.md) for detailed documentation.

## 🐳 Docker Deployment

### Full Stack

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

### Development Mode

```bash
# Start with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use make
make dev
```

Development mode includes:
- Hot reload for frontend and backend
- Debug ports exposed (Java: 5005)
- Verbose logging
- Volume mounts for live code updates

### Individual Services

```bash
# Start only infrastructure
docker-compose up -d payment-db keycloak-db keycloak

# Start only payment service
docker-compose up -d payment-service

# Start only frontend
docker-compose up -d web-frontend
```

## 🔧 Development

### Project Structure

- **`apps/`**: User-facing applications
  - Built with frontend frameworks (Next.js, React)
  - Can be deployed to CDNs or edge networks

- **`services/`**: Backend microservices
  - Independent Spring Boot/Node.js services
  - Each service has its own database
  - Communication via REST APIs

- **`packages/`**: Shared libraries
  - TypeScript types, utilities
  - Can be published to private npm registry

- **`infrastructure/`**: IaC and configurations
  - Docker configurations
  - Kubernetes manifests
  - Terraform scripts

### Adding a New Service

1. Create directory in `services/` or `apps/`
2. Add Dockerfile
3. Add service to `docker-compose.yml`
4. Update this README
5. Add to Makefile (optional)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `PAYMENT_SERVICE_PORT`: Payment API port (default: 8080)
- `WEB_FRONTEND_PORT`: Frontend port (default: 3000)
- `KEYCLOAK_PORT`: Keycloak port (default: 8180)
- `PAYMENT_DB_PASSWORD`: Payment database password
- `KEYCLOAK_ADMIN_PASSWORD`: Keycloak admin password

### Testing

```bash
# Test payment service
cd services/payment
./gradlew test

# Test frontend
cd apps/web-frontend
npm test
```

## 📚 Documentation

- [Payment Service Documentation](services/payment/README.md)
- [Payment Service Deployment Guide](services/payment/DEPLOYMENT.md)
- [Frontend CORS Solution](apps/web-frontend/CORS_SOLUTION.md)

## 🔐 Security

### Development Credentials

**⚠️ Never use these in production!**

- Keycloak Admin: `admin` / `admin`
- Payment User: `payment-user` / `password123`
- Payment Admin: `payment-admin` / `admin123`
- Payment DB: `paymentuser` / `paymentpass`
- Keycloak DB: `keycloak` / `keycloakpass`

### Production Checklist

- [ ] Change all default passwords
- [ ] Use secrets management (Docker Secrets, Vault)
- [ ] Enable HTTPS/TLS
- [ ] Configure production-grade databases
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backups
- [ ] Review Spring Security configuration
- [ ] Audit Keycloak settings
- [ ] Use environment-specific .env files

## 🎯 Makefile Commands

Quick commands for common tasks:

```bash
make up          # Start all services
make down        # Stop all services
make dev         # Start in development mode
make logs        # View all logs
make ps          # Show running containers
make clean       # Remove containers and volumes
make rebuild     # Rebuild all containers
make test        # Run all tests
```

## 🔍 Monitoring

### Health Checks

```bash
# Payment service
curl http://localhost:8080/api/actuator/health

# Keycloak
curl http://localhost:8180/health/ready

# Frontend
curl http://localhost:3000
```

### Container Status

```bash
docker-compose ps
docker stats
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f payment-service
docker-compose logs -f web-frontend
docker-compose logs -f keycloak
```

## 🚢 Production Deployment

### Docker Compose (Simple)

```bash
# Set production environment
export SPRING_PROFILES_ACTIVE=prod
export NODE_ENV=production

# Start with production config
docker-compose up -d
```

### Kubernetes (Recommended)

See `infrastructure/k8s/` for Kubernetes manifests.

```bash
kubectl apply -f infrastructure/k8s/
```

### Cloud Platforms

- **AWS**: ECS/EKS with RDS PostgreSQL
- **Azure**: AKS with Azure Database for PostgreSQL
- **GCP**: GKE with Cloud SQL

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes in appropriate directory
3. Test locally with Docker Compose
4. Submit PR with description

## 📄 License

Copyright (c) 2025 JStephenPerry

## 🆘 Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Check disk space
docker system df

# Clean up
docker system prune
```

### Port Conflicts

Update ports in `.env` file:
```
PAYMENT_SERVICE_PORT=8081
WEB_FRONTEND_PORT=3001
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose ps

# Restart databases
docker-compose restart payment-db keycloak-db
```

### Authentication Failures

1. Verify Keycloak is running: http://localhost:8180
2. Import realm configuration
3. Check user credentials
4. Verify token expiration

## 📞 Support

For issues and questions:
1. Check documentation in service directories
2. Review container logs
3. Check health endpoints
4. Create GitHub issue with details
