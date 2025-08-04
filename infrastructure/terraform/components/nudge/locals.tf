locals {
  aws_lambda_functions_dir_path        = "../../../../lambdas"
  log_destination_arn                  = "arn:aws:firehose:${var.region}:${var.aws_account_id}:deliverystream/nhs-main-obs-splunk-logs-firehose"
  is_sandbox                           = can(regex("sandbox", var.apim_base_url))
  apim_access_token_ssm_parameter_name = "/${var.component}/${var.environment}/apim/access_token"
  apim_api_key_ssm_parameter_name      = "/${var.component}/${var.environment}/apim/api_key"
  apim_private_key_ssm_parameter_name  = "/${var.component}/${var.environment}/apim/private_key"
  apim_keystore_s3_bucket              = "nhs-${var.aws_account_id}-${var.region}-${var.environment}-${var.component}-static-assets"
  root_domain_name                     = "${var.environment}.${local.acct.route53_zone_names["smsnudge"]}" # e.g. [main|dev|abxy0].smsnudge.[dev|nonprod|prod].nhsnotify.national.nhs.uk
  root_domain_id                       = local.acct.route53_zone_ids["smsnudge"]
}
