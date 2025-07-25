resource "aws_cloudfront_distribution" "public_key_hosting" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Public Key hosting for SMS Nudge"
  price_class         = "PriceClass_100"
  # web_acl_id          = var.cdn_waf_acl_arn

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["GB"]
    }
  }

  # aliases = [
  #   var.cloudfront_fqdn,
  # ]

  viewer_certificate {
    cloudfront_default_certificate = true
    # acm_certificate_arn      = aws_acm_certificate.frontend.arn
    # minimum_protocol_version = "TLSv1.2_2021"
    # ssl_support_method       = "sni-only"
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn_logs.bucket_regional_domain_name
  }

  # public keys bucket S3 origin
  origin {
    domain_name = aws_s3_bucket.public_keys.bucket_regional_domain_name
    origin_id   = "${var.csi}-origin-public-keys"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.public_keys.cloudfront_access_identity_path
    }
  }

  # public keys S3 content
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "${var.csi}-origin-public-keys"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
}
