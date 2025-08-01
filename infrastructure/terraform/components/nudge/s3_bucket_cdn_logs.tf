resource "aws_s3_bucket" "cdn_logs" {
  bucket        = "${local.csi_global}-cdn-logs"
  tags          = var.default_tags
  force_destroy = true
}

resource "aws_s3_bucket_ownership_controls" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "cdn_logs" {
  depends_on = [
    aws_s3_bucket.cdn_logs,
  ]

  bucket = aws_s3_bucket.cdn_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cdn_logs" {
  bucket                = aws_s3_bucket.cdn_logs.id
  expected_bucket_owner = var.aws_account_id

  rule {
    id     = "default"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = "30"
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = "90"
      storage_class = "GLACIER"
    }

    expiration {
      days = "365"
    }

    noncurrent_version_expiration {
      noncurrent_days = "30"
    }
  }
}

resource "aws_s3_bucket_policy" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id
  policy = data.aws_iam_policy_document.cdn_logs_bucket_policy.json
}

data "aws_iam_policy_document" "cdn_logs_bucket_policy" {
  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.cdn_logs.arn,
      "${aws_s3_bucket.cdn_logs.arn}/*",
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

  statement {
    effect  = "Allow"
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.cdn_logs.arn}/*",
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.static_assets.iam_arn]
    }
  }
}
