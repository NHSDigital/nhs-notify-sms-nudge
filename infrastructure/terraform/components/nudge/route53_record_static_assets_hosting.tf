resource "aws_route53_record" "static_assets_hosting" {
  name    = local.domain_name
  zone_id = data.aws_route53_zone.main.zone_id
  type    = "CNAME"
  ttl     = 5
  records = [aws_cloudfront_distribution.static_assets_hosting.domain_name]
}
