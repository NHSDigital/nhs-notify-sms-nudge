locals {
  aws_lambda_functions_dir_path        = "../../../../lambdas"
  log_destination_arn                  = "arn:aws:firehose:${var.region}:${var.aws_account_id}:deliverystream/nhs-main-obs-splunk-logs-firehose"
  is_sandbox                           = can(regex("sandbox", var.apim_base_url))
  apim_access_token_ssm_parameter_name = "/nudge/${var.environment}/apim/access_token"
  apim_api_key_ssm_parameter_name      = "/nudge/${var.environment}/apim/api_key"
  apim_private_key_ssm_parameter_name  = "/nudge/${var.environment}/apim/private_key"
  apim_keystore_s3_bucket              = "nhs-${var.aws_account_id}-${var.region}-${var.environment}-nudge-static-assets"
  domain_name                          = "${var.environment}.${data.aws_route53_zone.main.name}" # e.g. [main|dev|abxy0].smsnudge.[dev|nonprod|prod].nhsnotify.national.nhs.uk
}
