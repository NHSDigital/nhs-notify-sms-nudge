module "kms" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-kms.zip"


  providers = {
    aws           = aws
    aws.us-east-1 = aws.us-east-1
  }

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region

  name                 = "main"
  deletion_window      = var.kms_deletion_window
  alias                = "alias/${local.csi}"
  key_policy_documents = [data.aws_iam_policy_document.kms.json]
  iam_delegation       = true
}

data "aws_iam_policy_document" "kms" {
  # '*' resource scope is permitted in access policies as as the resource is itself
  # https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-services.html

  statement {
    sid    = "AllowEvents"
    effect = "Allow"

    principals {
      type = "Service"

      identifiers = [
        "events.amazonaws.com",
      ]
    }

    actions = [
      "kms:Encrypt*",
      "kms:Decrypt*",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Describe*"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "AllowSQS"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sqs.amazonaws.com"]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:Describe*"
    ]

    resources = ["*"]

    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:sqs:arn"
      values = [
        "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-nudge-inbound-event-queue",
        "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-nudge-command-queue",
        "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-nudge-inbound-event-dlq",
        "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-nudge-command-dlq",
      ]
    }
  }
  statement {
    sid    = "AllowCloudWatchLogsEncrypt"
    effect = "Allow"

    principals {
      type = "Service"

      identifiers = [
        "logs.${var.region}.amazonaws.com",
      ]
    }

    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:GenerateDataKey",
      "kms:DescribeKey"
    ]

    resources = [
      "*",
    ]
  }
}
