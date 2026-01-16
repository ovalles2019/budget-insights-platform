# Cloud Budgeting + Insights Platform

A production-ready, cloud-first personal finance management platform built with microservices architecture, demonstrating Capital One-style engineering practices.

## 🏗️ Architecture

This project showcases:
- **Microservices Architecture** - Transaction Service, Analytics Service, Frontend
- **Cloud-First** - Deployed on AWS (EKS, RDS, S3, ECR)
- **Containerization** - Docker containers for all services
- **Orchestration** - Kubernetes (EKS) for container orchestration
- **Infrastructure as Code** - Terraform for AWS infrastructure
- **CI/CD** - Jenkins pipeline for automated deployment
- **Observability** - Prometheus metrics, health checks, logging
- **"You Build It, You Own It"** - Monitoring, alerting, and operational readiness

## 📁 Project Structure

```
budget-insights-platform/
├── services/
│   ├── transaction-service/    # REST API for transaction management
│   ├── analytics-service/      # Anomaly detection & insights
│   └── auth-service/           # (Future) Authentication service
├── frontend/                   # React dashboard application
├── infrastructure/
│   ├── terraform/              # AWS infrastructure as code
│   └── kubernetes/             # K8s manifests
└── ci-cd/
    └── jenkins/                # CI/CD pipeline configuration
```

## 🚀 Features

### Transaction Service
- Import/export transactions
- Automatic categorization
- RESTful API
- Health checks and metrics

### Analytics Service
- Anomaly detection using statistical methods
- Budget tracking and status
- Spending insights and trends
- Real-time analytics

### Frontend
- Interactive dashboard with charts
- Budget management interface
- Anomaly alerts
- Spending insights visualization

## 🛠️ Tech Stack

**Backend:**
- Python 3.11
- Flask (REST APIs)
- Prometheus (metrics)

**Frontend:**
- React 18
- Recharts (data visualization)
- Axios (API client)

**Infrastructure:**
- AWS EKS (Kubernetes)
- AWS RDS (PostgreSQL)
- AWS S3 (data storage)
- AWS ECR (container registry)
- Terraform (IaC)
- Jenkins (CI/CD)

## 📦 Prerequisites

- Docker & Docker Compose
- Kubernetes CLI (kubectl)
- AWS CLI configured
- Terraform >= 1.0
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

## 🏃 Local Development

### Running Services Locally

1. **Transaction Service:**
```bash
cd services/transaction-service
pip install -r requirements.txt
python app.py
# Service runs on http://localhost:5001
```

2. **Analytics Service:**
```bash
cd services/analytics-service
pip install -r requirements.txt
export TRANSACTION_SERVICE_URL=http://localhost:5001
python app.py
# Service runs on http://localhost:5002
```

3. **Frontend:**
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Using Docker Compose

```bash
docker-compose up -d
```

## 🐳 Building Docker Images

```bash
# Transaction Service
docker build -t transaction-service:latest services/transaction-service/

# Analytics Service
docker build -t analytics-service:latest services/analytics-service/

# Frontend
docker build -t frontend:latest frontend/
```

## ☸️ Kubernetes Deployment

### Prerequisites
- EKS cluster created (via Terraform)
- kubectl configured to access cluster

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/transaction-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/analytics-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f infrastructure/kubernetes/ingress.yaml

# Deploy monitoring
kubectl apply -f infrastructure/kubernetes/monitoring.yaml

# Check status
kubectl get pods -n budget-insights
kubectl get services -n budget-insights
```

## 🏗️ Infrastructure Setup (Terraform)

### Initialize Terraform

```bash
cd infrastructure/terraform

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
aws_region = "us-east-1"
environment = "prod"
db_username = "admin"
db_password = "your-secure-password"
EOF

# Initialize
terraform init

# Plan
terraform plan

# Apply
terraform apply
```

### Terraform Outputs

After applying, Terraform will output:
- EKS cluster endpoint
- RDS endpoint
- S3 bucket name
- ECR repository URLs

## 🔄 CI/CD Pipeline (Jenkins)

### Setup Jenkins

1. Install required Jenkins plugins:
   - Docker Pipeline
   - Kubernetes CLI
   - AWS Credentials
   - Pipeline

2. Configure credentials:
   - `aws-credentials` - AWS access key and secret
   - `aws-account-id` - AWS account ID

3. Create Pipeline job:
   - Point to `ci-cd/jenkins/Jenkinsfile`
   - Configure SCM (Git repository)

### Pipeline Stages

1. **Checkout** - Source code retrieval
2. **Build** - Docker image builds (parallel)
3. **Test** - Unit and integration tests
4. **Security Scan** - Vulnerability scanning
5. **Push to ECR** - Image registry push
6. **Deploy to K8s** - Kubernetes deployment
7. **Health Check** - Service verification

## 📊 Monitoring & Observability

### Health Checks

All services expose `/health` endpoints:
- `http://transaction-service:5001/health`
- `http://analytics-service:5002/health`

### Metrics

Prometheus metrics available at `/metrics`:
- HTTP request counts and durations
- Transaction processing metrics
- Anomaly detection metrics
- Resource utilization

### Logging

- CloudWatch Log Groups configured for all services
- Structured logging with service identification
- Log retention: 7 days

### Alerts

Prometheus alerting rules configured for:
- High error rates
- Service downtime
- High memory/CPU usage

## 🔒 Security

- **Encryption at Rest**: RDS and S3 encryption enabled
- **Encryption in Transit**: TLS/SSL for all services
- **Image Scanning**: Trivy security scans in CI/CD
- **Network Security**: VPC, security groups, private subnets
- **Secrets Management**: Environment variables and AWS Secrets Manager

## 📈 Scaling

### Horizontal Pod Autoscaling (HPA)

Services automatically scale based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Min replicas: 2
- Max replicas: 10

### Manual Scaling

```bash
kubectl scale deployment transaction-service --replicas=5 -n budget-insights
```

## 🧪 Testing

### API Testing

```bash
# Health check
curl http://localhost:5001/health

# Import mock data
curl -X POST http://localhost:5001/api/v1/transactions/import \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "count": 50}'

# Get transactions
curl http://localhost:5001/api/v1/transactions?user_id=test_user

# Get analytics
curl http://localhost:5002/api/v1/analytics/summary?user_id=test_user
```

## 🐛 Troubleshooting

### Service Not Starting

```bash
# Check pod logs
kubectl logs -f deployment/transaction-service -n budget-insights

# Check service status
kubectl describe pod <pod-name> -n budget-insights
```

### Database Connection Issues

- Verify RDS security group allows connections from EKS
- Check RDS endpoint in service environment variables
- Verify database credentials

### Image Pull Errors

- Ensure ECR repositories exist
- Verify AWS credentials in Jenkins
- Check image tags in deployment manifests

## 📝 API Documentation

### Transaction Service

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/transactions?user_id={id}` - Get transactions
- `POST /api/v1/transactions` - Create transaction
- `POST /api/v1/transactions/import` - Import mock data
- `GET /api/v1/transactions/{id}` - Get transaction
- `DELETE /api/v1/transactions/{id}` - Delete transaction
- `GET /api/v1/categories` - Get categories

### Analytics Service

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/analytics/anomalies?user_id={id}` - Get anomalies
- `POST /api/v1/analytics/budget` - Calculate budget status
- `GET /api/v1/analytics/insights?user_id={id}` - Get insights
- `GET /api/v1/analytics/summary?user_id={id}` - Get summary

## 🎯 Capital One Alignment

This project demonstrates:

✅ **Cloud-First Architecture** - AWS-native services  
✅ **Microservices** - Independent, scalable services  
✅ **REST APIs** - Standardized API design  
✅ **Containers & Kubernetes** - Container orchestration  
✅ **Infrastructure as Code** - Terraform for all infrastructure  
✅ **CI/CD** - Automated deployment pipeline  
✅ **You Build It, You Own It** - Monitoring, alerting, operational readiness  
✅ **Production-Ready** - Health checks, metrics, logging, scaling  

## 📄 License

This project is for portfolio/demonstration purposes.

## 👤 Author

Built as a portfolio project demonstrating enterprise-level cloud engineering practices.

---

**Note**: This is a demonstration project. For production use, implement:
- Authentication & authorization
- Database persistence (currently in-memory)
- Rate limiting
- API versioning
- Comprehensive error handling
- Unit and integration tests
- Documentation (OpenAPI/Swagger)
