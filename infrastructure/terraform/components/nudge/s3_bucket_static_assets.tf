module "s3bucket_static_assets" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/s3bucket?ref=v1.0.9"

  providers = {
    aws = aws.us-east-1
  }

  name = "static-assets"

  aws_account_id = var.aws_account_id
  region         = "us-east-1"
  project        = var.project
  environment    = var.environment
  component      = var.component

  acl           = "private"
  force_destroy = false
  versioning    = true

  lifecycle_rules = [
    {
      enabled = true

      noncurrent_version_transition = [
        {
          noncurrent_days = "30"
          storage_class   = "STANDARD_IA"
        }
      ]

      noncurrent_version_expiration = {
        noncurrent_days = "90"
      }

      abort_incomplete_multipart_upload = {
        days = "1"
      }
    }
  ]

  bucket_logging_target = {
    bucket = local.acct.s3_buckets["access_logs"]["id"]
  }

  policy_documents = [
    data.aws_iam_policy_document.static_assets_bucket_policy.json
  ]

  public_access = {
    block_public_acls       = true
    block_public_policy     = true
    ignore_public_acls      = true
    restrict_public_buckets = true
  }


  default_tags = {
    Name = "SMS Nudge static assets bucket"
  }
}

data "aws_iam_policy_document" "static_assets_bucket_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${module.s3bucket_static_assets.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.static_assets.iam_arn]
    }
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      module.s3bucket_static_assets.arn
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.static_assets.iam_arn]
    }
  }

  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      module.s3bucket_static_assets.arn,
      "${module.s3bucket_static_assets.arn}/*",
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        false
      ]
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "static_assets" {
  bucket = module.s3bucket_static_assets.bucket

  cors_rule {
    allowed_headers = ["Authorization"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }
}

resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "Used to access the s3 content for the ${module.s3bucket_static_assets.bucket} bucket"
}
