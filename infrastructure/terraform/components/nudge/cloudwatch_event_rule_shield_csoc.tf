resource "aws_cloudwatch_event_rule" "shield_csoc" {
  count       = var.csoc_log_forwarding ? 1 : 0
  provider    = aws.us-east-1
  name        = "${local.csi}-shield-alarm-state-change"
  description = "Triggered whenever a Shield-related CloudWatch Alarm changes state"

  event_pattern = jsonencode({
    source      = ["aws.cloudwatch"]
    detail-type = ["CloudWatch Alarm State Change"]
    detail = {
      "configuration" = {
        "description" = [{ "prefix" = "SHIELD:" }]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "shield_csoc" {
  count     = var.csoc_log_forwarding ? 1 : 0
  provider  = aws.us-east-1
  rule      = aws_cloudwatch_event_rule.shield_csoc[0].name
  target_id = "SendToCSOCAccount"
  arn       = local.csoc_event_rule_shield_csoc_arn
  role_arn  = aws_iam_role.shield_csoc_event_target[0].arn
}

resource "aws_iam_role" "shield_csoc_event_target" {
  count    = var.csoc_log_forwarding ? 1 : 0
  provider = aws.us-east-1
  name     = "${local.csi}-shield-csoc-event-target-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.aws_account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "shield_csoc_event_target" {
  count    = var.csoc_log_forwarding ? 1 : 0
  provider = aws.us-east-1
  name     = "${local.csi}-shield-csoc-event-target-policy"
  role     = aws_iam_role.shield_csoc_event_target[0].id
  policy   = data.aws_iam_policy_document.shield_csoc_event_target[0].json
}

data "aws_iam_policy_document" "shield_csoc_event_target" {
  count    = var.csoc_log_forwarding ? 1 : 0
  provider = aws.us-east-1

  statement {
    sid    = "AllowPutEventsToCSocBus"
    effect = "Allow"

    actions = [
      "events:PutEvents"
    ]

    resources = [
      local.csoc_event_rule_shield_csoc_arn
    ]
  }
}
