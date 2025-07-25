module "keygen_web_frontend" {
  source         = "../../modules/public_key_hosting"
  csi            = local.csi
  csi_global     = local.csi_global
  default_tags   = local.default_tags
  aws_account_id = var.aws_account_id
}
