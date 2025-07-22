locals {
  aws_lambda_functions_dir_path = "../../../../lambdas"
  log_destination_arn           = "arn:aws:firehose:${var.region}:${var.aws_account_id}:deliverystream/nhs-main-obs-splunk-logs-firehose"
}
