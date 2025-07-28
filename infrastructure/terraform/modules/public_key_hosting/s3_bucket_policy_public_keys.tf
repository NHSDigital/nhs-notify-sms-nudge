resource "aws_s3_bucket_policy" "public_keys" {
  bucket = aws_s3_bucket.public_keys.id
  policy = data.aws_iam_policy_document.public_keys_bucket_policy.json
}

data "aws_iam_policy_document" "public_keys_bucket_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.public_keys.arn}/*"
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.public_keys.iam_arn]
    }
  }

  statement {
    actions = ["s3:ListBucket"]
    resources = [
      aws_s3_bucket.public_keys.arn
    ]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.public_keys.iam_arn]
    }
  }

  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.public_keys.arn,
      "${aws_s3_bucket.public_keys.arn}/*",
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
