locals {
  root_domain_name              = "${var.environment}.${local.acct.dns_zone["name"]}" # e.g. [main|dev|abxy0].web-frontend.[dev|nonprod|prod].nhsnotify.national.nhs.uk
  aws_lambda_functions_dir_path = "../../../../lambdas"
}
