module "keygen_web_frontend" {
  source         = "../../modules/keygen_web_frontend"
  csi            = local.csi
  csi_global     = local.csi_global
  default_tags   = local.default_tags
  aws_account_id = var.aws_account_id
}
