module "lambda_command_processor" {
  source = "git::https://github.com/NHSDigital/nhs-notify-shared-modules.git//infrastructure/modules/lambda?ref=v2.0.10"

  function_name = "command-processor"
  description   = "A function for processing command messages from SQS"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.lambda_command_processor.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "command-processor/dist"
  function_include_common = true
  handler_function_name   = "handler"
  runtime                 = "nodejs22.x"
  memory                  = 128
  timeout                 = 5
  log_level               = var.log_level

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  send_to_firehose          = true
  log_destination_arn       = "arn:aws:firehose:${var.region}:${var.aws_account_id}:deliverystream/nhs-main-obs-splunk-logs-firehose"
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = {
    "SEND_MESSAGE_URL" = var.send_message_url
    "ROUTING_PLAN_ID"  = local.is_sandbox ? "b838b13c-f98c-4def-93f0-515d4e4f4ee1" : "fc4f8c6b-1547-4216-9237-c7027c97ae60"
  }
}

data "aws_iam_policy_document" "lambda_command_processor" {
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
    sid    = "SQSPermissionsCommandQueue"
    effect = "Allow"

    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]

    resources = [
      module.sqs_command.sqs_queue_arn,
    ]
  }
}
