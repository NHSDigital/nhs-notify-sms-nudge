module "sqs_inbound_event" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/sqs?ref=v2.0.10"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  name           = "inbound-event"

  sqs_kms_key_arn = module.kms.key_arn

  visibility_timeout_seconds = 60

  create_dlq = true

  sqs_policy_overload = data.aws_iam_policy_document.sqs_inbound_event.json
}

data "aws_iam_policy_document" "sqs_inbound_event" {
  statement {
    sid    = "AllowEventBridgeToSendMessage"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      "arn:aws:sqs:${var.region}:${var.aws_account_id}:${var.project}-${var.environment}-${var.component}-inbound-event-queue"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:events:${var.region}:${var.event_bus_account_id}:rule/*-data-plane/*"]
    }
  }
}
