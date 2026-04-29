resource "aws_shield_protection" "cdn" {
  provider = aws.us-east-1

  name         = "${local.csi}-cdn-protection"
  resource_arn = aws_cloudfront_distribution.static_assets_hosting.arn

  tags = {
    Environment = var.environment
  }
}
