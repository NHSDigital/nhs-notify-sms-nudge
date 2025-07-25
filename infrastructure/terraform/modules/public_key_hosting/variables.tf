variable "csi" {
  type        = string
  description = "CSI for use in resources without a global namespace, i.e. Lambdas"
}

variable "csi_global" {
  type        = string
  description = "CSI for use in resources with a global namespace, i.e. S3 Buckets"
}

variable "default_tags" {
  type        = map(string)
  description = "Default tags for resources"
}

variable "aws_account_id" {
  type        = string
  description = "The AWS Account ID (numeric)"
}
