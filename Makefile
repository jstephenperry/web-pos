.PHONY: help up down dev logs ps clean rebuild test restart health

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo '$(BLUE)Web POS - Available Commands$(NC)'
	@echo ''
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

up: ## Start all services in production mode
	@echo '$(YELLOW)Starting all services...$(NC)'
	docker-compose up -d
	@echo '$(GREEN)✓ All services started$(NC)'
	@make health

down: ## Stop all services
	@echo '$(YELLOW)Stopping all services...$(NC)'
	docker-compose down
	@echo '$(GREEN)✓ All services stopped$(NC)'

dev: ## Start all services in development mode with hot reload
	@echo '$(YELLOW)Starting in development mode...$(NC)'
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

logs: ## View logs from all services
	docker-compose logs -f

logs-payment: ## View payment service logs
	docker-compose logs -f payment-service

logs-frontend: ## View frontend logs
	docker-compose logs -f web-frontend

logs-keycloak: ## View Keycloak logs
	docker-compose logs -f keycloak

ps: ## Show running containers
	docker-compose ps

restart: ## Restart all services
	@echo '$(YELLOW)Restarting all services...$(NC)'
	docker-compose restart
	@echo '$(GREEN)✓ All services restarted$(NC)'

restart-payment: ## Restart payment service
	docker-compose restart payment-service

restart-frontend: ## Restart frontend
	docker-compose restart web-frontend

clean: ## Stop services and remove containers, networks, and volumes
	@echo '$(YELLOW)Cleaning up...$(NC)'
	docker-compose down -v
	@echo '$(GREEN)✓ Cleanup complete$(NC)'

rebuild: ## Rebuild all containers
	@echo '$(YELLOW)Rebuilding all containers...$(NC)'
	docker-compose build --no-cache
	@echo '$(GREEN)✓ Rebuild complete$(NC)'

rebuild-payment: ## Rebuild payment service
	docker-compose build --no-cache payment-service

rebuild-frontend: ## Rebuild frontend
	docker-compose build --no-cache web-frontend

test: ## Run all tests
	@echo '$(YELLOW)Running payment service tests...$(NC)'
	cd services/payment && ./gradlew test
	@echo '$(YELLOW)Running frontend tests...$(NC)'
	cd apps/web-frontend && npm test
	@echo '$(GREEN)✓ All tests completed$(NC)'

test-payment: ## Run payment service tests
	cd services/payment && ./gradlew test

test-frontend: ## Run frontend tests
	cd apps/web-frontend && npm test

health: ## Check health of all services
	@echo '$(YELLOW)Checking service health...$(NC)'
	@echo -n 'Payment Service: '
	@curl -sf http://localhost:8080/api/actuator/health > /dev/null && echo '$(GREEN)✓ Healthy$(NC)' || echo '$(YELLOW)⚠ Not Ready$(NC)'
	@echo -n 'Keycloak:        '
	@curl -sf http://localhost:8180/health/ready > /dev/null && echo '$(GREEN)✓ Healthy$(NC)' || echo '$(YELLOW)⚠ Not Ready$(NC)'
	@echo -n 'Frontend:        '
	@curl -sf http://localhost:3000 > /dev/null && echo '$(GREEN)✓ Healthy$(NC)' || echo '$(YELLOW)⚠ Not Ready$(NC)'

stats: ## Show container resource usage
	docker stats --no-stream

shell-payment: ## Open shell in payment service container
	docker exec -it webpos-payment-service sh

shell-frontend: ## Open shell in frontend container
	docker exec -it webpos-web-frontend sh

shell-db: ## Open PostgreSQL shell for payment database
	docker exec -it webpos-payment-db psql -U paymentuser -d paymentdb

install: ## Install dependencies for local development
	@echo '$(YELLOW)Installing frontend dependencies...$(NC)'
	cd apps/web-frontend && npm install
	@echo '$(YELLOW)Installing payment service dependencies...$(NC)'
	cd services/payment && ./gradlew build
	@echo '$(GREEN)✓ Dependencies installed$(NC)'

format: ## Format code
	@echo '$(YELLOW)Formatting frontend code...$(NC)'
	cd apps/web-frontend && npm run format || true
	@echo '$(YELLOW)Formatting payment service code...$(NC)'
	cd services/payment && ./gradlew spotlessApply || true
	@echo '$(GREEN)✓ Code formatted$(NC)'

backup-db: ## Backup payment database
	@mkdir -p backups
	docker exec webpos-payment-db pg_dump -U paymentuser paymentdb > backups/payment-db-$$(date +%Y%m%d-%H%M%S).sql
	@echo '$(GREEN)✓ Database backup created$(NC)'

env: ## Copy .env.example to .env
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo '$(GREEN)✓ .env file created from .env.example$(NC)'; \
	else \
		echo '$(YELLOW)⚠ .env file already exists$(NC)'; \
	fi

setup: env ## Initial setup (copy env file and start services)
	@echo '$(YELLOW)Running initial setup...$(NC)'
	@make up
	@echo ''
	@echo '$(GREEN)✓ Setup complete!$(NC)'
	@echo ''
	@echo '$(BLUE)Next steps:$(NC)'
	@echo '1. Import Keycloak realm: http://localhost:8180 (admin/admin)'
	@echo '2. Import: services/payment/keycloak/payment-realm.json'
	@echo '3. Test the API: cd services/payment && ./scripts/get-token.sh'
	@echo '4. Access frontend: http://localhost:3000'

prune: ## Remove all unused Docker resources
	@echo '$(YELLOW)Pruning Docker resources...$(NC)'
	docker system prune -af --volumes
	@echo '$(GREEN)✓ Prune complete$(NC)'
