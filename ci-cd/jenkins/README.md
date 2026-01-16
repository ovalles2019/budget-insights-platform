# Jenkins CI/CD Pipeline

This directory contains the Jenkins pipeline configuration for automated build, test, and deployment.

## Pipeline Stages

1. **Checkout** - Retrieves source code from repository
2. **Build Docker Images** - Builds all three services in parallel
3. **Run Tests** - Executes unit and integration tests
4. **Security Scan** - Scans Docker images for vulnerabilities using Trivy
5. **Push to ECR** - Pushes images to AWS ECR
6. **Deploy to Kubernetes** - Deploys to EKS cluster
7. **Health Check** - Verifies services are healthy

## Setup

1. Install Jenkins with required plugins:
   - Docker Pipeline
   - Kubernetes CLI
   - AWS Credentials
   - Pipeline

2. Configure credentials in Jenkins:
   - `aws-credentials` - AWS access key and secret
   - `aws-account-id` - AWS account ID

3. Create a new Pipeline job and point it to `Jenkinsfile`

## Environment Variables

- `AWS_REGION` - AWS region (default: us-east-1)
- `EKS_CLUSTER_NAME` - EKS cluster name
- `ECR_REGISTRY` - ECR registry URL
