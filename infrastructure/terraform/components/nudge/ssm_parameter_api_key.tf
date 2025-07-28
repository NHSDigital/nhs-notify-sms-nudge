resource "aws_ssm_parameter" "api_key" {
  name = locals.apim_api_key_ssm_parameter_name
  description = "Access token for APIM"
  type        = "SecureString"
  value = jsonencode({
    tokens = []
  })
  tags = merge(local.default_tags, { Backup = "true" })

  lifecycle {
    ignore_changes = [
      value
    ]
  }
}
