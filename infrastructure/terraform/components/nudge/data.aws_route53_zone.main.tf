data "aws_route53_zone" "main" {
  name = "smsnudge.${var.root_domain_name}"
}
