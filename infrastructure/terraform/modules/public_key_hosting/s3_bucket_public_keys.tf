resource "aws_s3_bucket" "public_keys" {
  bucket = "${var.csi_global}-public-keys"
  tags   = var.default_tags
}

resource "aws_s3_bucket_cors_configuration" "public_keys" {
  bucket = aws_s3_bucket.public_keys.bucket

  cors_rule {
    allowed_headers = ["Authorization"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }
}

resource "aws_cloudfront_origin_access_identity" "public_keys" {
  comment = "Used to access the s3 content for the ${aws_s3_bucket.public_keys.bucket} bucket"
}

resource "aws_s3_bucket_ownership_controls" "public_keys" {
  bucket = aws_s3_bucket.public_keys.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "public_keys" {
  bucket = aws_s3_bucket.public_keys.bucket

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "public_keys" {
  bucket = aws_s3_bucket.public_keys.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "public_keys" {
  depends_on = [
    aws_s3_bucket.public_keys,
    aws_s3_bucket_policy.public_keys
  ]

  bucket = aws_s3_bucket.public_keys.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "public_keys" {
  bucket                = aws_s3_bucket.public_keys.id
  expected_bucket_owner = var.aws_account_id

  rule {
    id     = "default"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = "30"
    }
  }
}
