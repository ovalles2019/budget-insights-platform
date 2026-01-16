.PHONY: help build push deploy test clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker build -t transaction-service:latest services/transaction-service/
	docker build -t analytics-service:latest services/analytics-service/
	docker build -t frontend:latest frontend/

build-local: ## Build and run locally with docker-compose
	docker-compose up --build

test-services: ## Test services locally
	@echo "Testing transaction service..."
	curl -f http://localhost:5001/health || echo "Transaction service not running"
	@echo "Testing analytics service..."
	curl -f http://localhost:5002/health || echo "Analytics service not running"

install-frontend: ## Install frontend dependencies
	cd frontend && npm install

run-frontend: ## Run frontend in development mode
	cd frontend && npm start

run-transaction-service: ## Run transaction service locally
	cd services/transaction-service && pip install -r requirements.txt && python app.py

run-analytics-service: ## Run analytics service locally
	cd services/analytics-service && pip install -r requirements.txt && export TRANSACTION_SERVICE_URL=http://localhost:5001 && python app.py

terraform-init: ## Initialize Terraform
	cd infrastructure/terraform && terraform init

terraform-plan: ## Plan Terraform changes
	cd infrastructure/terraform && terraform plan

terraform-apply: ## Apply Terraform changes
	cd infrastructure/terraform && terraform apply

terraform-destroy: ## Destroy Terraform infrastructure
	cd infrastructure/terraform && terraform destroy

k8s-deploy: ## Deploy to Kubernetes
	kubectl apply -f infrastructure/kubernetes/namespace.yaml
	kubectl apply -f infrastructure/kubernetes/transaction-service-deployment.yaml
	kubectl apply -f infrastructure/kubernetes/analytics-service-deployment.yaml
	kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml
	kubectl apply -f infrastructure/kubernetes/monitoring.yaml

k8s-status: ## Check Kubernetes deployment status
	kubectl get pods -n budget-insights
	kubectl get services -n budget-insights

k8s-logs: ## View logs from all services
	kubectl logs -f deployment/transaction-service -n budget-insights &
	kubectl logs -f deployment/analytics-service -n budget-insights &
	kubectl logs -f deployment/frontend -n budget-insights

clean: ## Clean up local Docker images and containers
	docker-compose down
	docker system prune -f
