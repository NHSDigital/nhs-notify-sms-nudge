data "aws_route53_zone" "main" {
  name = "smsnudge.${local.root_domain_name}"
}
