terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket = "budget-insights-terraform-state"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC for EKS cluster
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "budget-insights-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Terraform   = "true"
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "budget-insights-eks"
  cluster_version = "1.28"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  cluster_endpoint_public_access = true
  cluster_endpoint_private_access = true
  
  # Node groups
  eks_managed_node_groups = {
    main = {
      min_size     = 2
      max_size     = 5
      desired_size = 3
      
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      
      labels = {
        Environment = var.environment
        Project     = "budget-insights-platform"
      }
    }
  }
  
  tags = {
    Terraform   = "true"
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

# RDS PostgreSQL for transaction storage
resource "aws_db_instance" "postgres" {
  identifier = "budget-insights-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "budgetinsights"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name        = "budget-insights-db"
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "budget-insights-db-subnet"
  subnet_ids = module.vpc.private_subnets
  
  tags = {
    Name = "budget-insights-db-subnet"
  }
}

resource "aws_security_group" "rds" {
  name        = "budget-insights-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "budget-insights-rds-sg"
  }
}

# S3 bucket for application data
resource "aws_s3_bucket" "app_data" {
  bucket = "budget-insights-app-data-${var.environment}"
  
  tags = {
    Name        = "budget-insights-app-data"
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ECR repositories for Docker images
resource "aws_ecr_repository" "transaction_service" {
  name                 = "budget-insights/transaction-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_ecr_repository" "analytics_service" {
  name                 = "budget-insights/analytics-service"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "budget-insights/frontend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "transaction_service" {
  name              = "/aws/eks/budget-insights/transaction-service"
  retention_in_days = 7
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_cloudwatch_log_group" "analytics_service" {
  name              = "/aws/eks/budget-insights/analytics-service"
  retention_in_days = 7
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/aws/eks/budget-insights/frontend"
  retention_in_days = 7
  
  tags = {
    Environment = var.environment
    Project     = "budget-insights-platform"
  }
}
