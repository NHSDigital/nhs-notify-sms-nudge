module "lambda_event_command_transformer" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda?ref=v2.0.10"

  function_name = "event-command-transformer"
  description   = "A function for transforming inbound unnotified messages from SQS to commands"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.lambda_event_command_transformer.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "event-command-transformer/dist"
  function_include_common = true
  handler_function_name   = "handler"
  runtime                 = "nodejs20.x"
  memory                  = 128
  timeout                 = 5
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  lambda_env_vars = {
    COMMANDS_QUEUE_URL = module.sqs_command.sqs_queue_url
    EVENTS_DLQ_URL     = module.sqs_inbound_event.sqs_dlq_url
  }
}

data "aws_iam_policy_document" "lambda_event_command_transformer" {
  statement {
    sid    = "KMSPermissions"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:GenerateDataKey",
    ]

    resources = [
      module.kms.key_arn,
    ]
  }

  statement {
    sid    = "SQSPermissionsInboundEventQueue"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]

    resources = [
      module.sqs_inbound_event.sqs_queue_arn,
    ]
  }

  statement {
    sid    = "SQSPermissionsCommandQueue"
    effect = "Allow"

    actions = [
      "sqs:SendMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]

    resources = [
      module.sqs_command.sqs_queue_arn,
    ]
  }
}
