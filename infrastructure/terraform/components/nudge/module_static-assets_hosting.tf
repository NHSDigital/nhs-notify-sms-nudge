module "keygen_web_frontend" {
  source         = "../../modules/static_assets_hosting"
  csi            = local.csi
  csi_global     = local.csi_global
  default_tags   = local.default_tags
  aws_account_id = var.aws_account_id
  domain_name    = local.domain_name
}
