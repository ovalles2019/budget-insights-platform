output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for application data"
  value       = aws_s3_bucket.app_data.id
}

output "ecr_repositories" {
  description = "ECR repository URLs"
  value = {
    transaction_service = aws_ecr_repository.transaction_service.repository_url
    analytics_service   = aws_ecr_repository.analytics_service.repository_url
    frontend            = aws_ecr_repository.frontend.repository_url
  }
}
