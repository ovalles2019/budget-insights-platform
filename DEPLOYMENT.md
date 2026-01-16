# Deployment Guide

This guide walks through deploying the Budget Insights Platform to AWS using Terraform and Kubernetes.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** >= 1.0 installed
4. **kubectl** installed and configured
5. **Docker** installed
6. **Jenkins** (optional, for CI/CD)

## Step 1: Infrastructure Setup (Terraform)

### 1.1 Configure Terraform

```bash
cd infrastructure/terraform

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
aws_region = "us-east-1"
environment = "prod"
db_username = "admin"
db_password = "CHANGE_THIS_SECURE_PASSWORD"
EOF
```

### 1.2 Initialize and Apply

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply infrastructure
terraform apply
```

This will create:
- VPC with public/private subnets
- EKS cluster
- RDS PostgreSQL instance
- S3 bucket
- ECR repositories
- CloudWatch log groups

### 1.3 Save Outputs

```bash
# Get EKS cluster name
terraform output eks_cluster_id

# Configure kubectl
aws eks update-kubeconfig --name $(terraform output -raw eks_cluster_id) --region us-east-1

# Verify connection
kubectl get nodes
```

## Step 2: Build and Push Docker Images

### 2.1 Authenticate with ECR

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

### 2.2 Build Images

```bash
# Get ECR repository URLs from Terraform
ECR_BASE=$(terraform output -json ecr_repositories | jq -r '.transaction_service' | sed 's|/transaction-service||')

# Build and tag images
docker build -t ${ECR_BASE}/transaction-service:latest services/transaction-service/
docker build -t ${ECR_BASE}/analytics-service:latest services/analytics-service/
docker build -t ${ECR_BASE}/frontend:latest frontend/
```

### 2.3 Push to ECR

```bash
docker push ${ECR_BASE}/transaction-service:latest
docker push ${ECR_BASE}/analytics-service:latest
docker push ${ECR_BASE}/frontend:latest
```

## Step 3: Update Kubernetes Manifests

Update the image references in Kubernetes manifests:

```bash
cd infrastructure/kubernetes

# Replace image URLs (adjust ECR_BASE as needed)
ECR_BASE="123456789012.dkr.ecr.us-east-1.amazonaws.com/budget-insights"

sed -i.bak "s|budget-insights-platform/transaction-service:latest|${ECR_BASE}/transaction-service:latest|g" transaction-service-deployment.yaml
sed -i.bak "s|budget-insights-platform/analytics-service:latest|${ECR_BASE}/analytics-service:latest|g" analytics-service-deployment.yaml
sed -i.bak "s|budget-insights-platform/frontend:latest|${ECR_BASE}/frontend:latest|g" frontend-deployment.yaml
```

## Step 4: Deploy to Kubernetes

### 4.1 Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 4.2 Deploy Services

```bash
# Deploy in order
kubectl apply -f transaction-service-deployment.yaml
kubectl apply -f analytics-service-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

### 4.3 Deploy Ingress (Optional)

```bash
# Install NGINX Ingress Controller first
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/aws/deploy.yaml

# Then apply ingress
kubectl apply -f ingress.yaml
```

### 4.4 Deploy Monitoring

```bash
kubectl apply -f monitoring.yaml
```

## Step 5: Verify Deployment

### 5.1 Check Pod Status

```bash
kubectl get pods -n budget-insights
kubectl get services -n budget-insights
```

### 5.2 Check Logs

```bash
# Transaction service logs
kubectl logs -f deployment/transaction-service -n budget-insights

# Analytics service logs
kubectl logs -f deployment/analytics-service -n budget-insights

# Frontend logs
kubectl logs -f deployment/frontend -n budget-insights
```

### 5.3 Test Health Endpoints

```bash
# Port forward to test locally
kubectl port-forward svc/transaction-service 5001:5001 -n budget-insights
kubectl port-forward svc/analytics-service 5002:5002 -n budget-insights
kubectl port-forward svc/frontend 8080:80 -n budget-insights

# Test health
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:8080
```

### 5.4 Get External IP

```bash
# Get LoadBalancer external IP
kubectl get svc frontend -n budget-insights

# Access the application
curl http://<EXTERNAL-IP>
```

## Step 6: CI/CD Setup (Jenkins)

### 6.1 Install Jenkins Plugins

Required plugins:
- Docker Pipeline
- Kubernetes CLI
- AWS Credentials
- Pipeline

### 6.2 Configure Credentials

In Jenkins:
1. Go to Credentials → System → Global credentials
2. Add AWS credentials:
   - ID: `aws-credentials`
   - Type: AWS Credentials
   - Access Key ID and Secret Access Key

3. Add AWS Account ID:
   - ID: `aws-account-id`
   - Type: Secret text
   - Secret: Your AWS Account ID

### 6.3 Create Pipeline Job

1. New Item → Pipeline
2. Configure:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your Git repository
   - Script Path: `ci-cd/jenkins/Jenkinsfile`

### 6.4 Run Pipeline

Click "Build Now" to trigger the pipeline.

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod for events
kubectl describe pod <pod-name> -n budget-insights

# Check events
kubectl get events -n budget-insights --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Verify ECR access
aws ecr describe-repositories

# Check image pull secrets
kubectl get secrets -n budget-insights
```

### Service Connection Issues

```bash
# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Inside pod:
wget -O- http://transaction-service:5001/health
```

### Database Connection

```bash
# Get RDS endpoint
terraform output rds_endpoint

# Update service environment variables if needed
kubectl set env deployment/transaction-service \
  DB_HOST=$(terraform output -raw rds_endpoint) \
  -n budget-insights
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment transaction-service --replicas=5 -n budget-insights
```

### Auto-scaling (HPA)

HPA is configured in `monitoring.yaml`. It will automatically scale based on CPU and memory usage.

## Monitoring

### View Metrics

```bash
# Port forward Prometheus (if installed)
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Access Prometheus UI
open http://localhost:9090
```

### View Logs in CloudWatch

```bash
# Log groups are created by Terraform
aws logs describe-log-groups --log-group-name-prefix "/aws/eks/budget-insights"
```

## Cleanup

To destroy all resources:

```bash
# Delete Kubernetes resources
kubectl delete namespace budget-insights

# Destroy Terraform infrastructure
cd infrastructure/terraform
terraform destroy
```

**Warning**: This will delete all resources including databases. Make sure to backup data first!
