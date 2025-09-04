module "lambda_apim_key_generation" {
  source = "https://github.com/NHSDigital/nhs-notify-shared-modules/releases/download/v2.0.20/terraform-lambda.zip"

  function_name = "apim-key-generation"
  description   = "A function to generate APIM public and private keys"

  aws_account_id = var.aws_account_id
  component      = var.component
  environment    = var.environment
  project        = var.project
  region         = var.region
  group          = var.group

  log_retention_in_days = var.log_retention_in_days
  kms_key_arn           = module.kms.key_arn

  iam_policy_document = {
    body = data.aws_iam_policy_document.lambda_apim_key_generation.json
  }

  function_s3_bucket      = local.acct.s3_buckets["lambda_function_artefacts"]["id"]
  function_code_base_path = local.aws_lambda_functions_dir_path
  function_code_dir       = "key-generation/dist"
  function_include_common = true
  function_module_name    = "lambda"
  handler_function_name   = "handler"
  runtime                 = "nodejs22.x"
  memory                  = 512
  timeout                 = 300
  log_level               = var.log_level
  schedule                = var.apim_keygen_schedule

  force_lambda_code_deploy = var.force_lambda_code_deploy
  enable_lambda_insights   = false

  send_to_firehose          = true
  log_destination_arn       = local.log_destination_arn
  log_subscription_role_arn = local.acct.log_subscription_role_arn

  lambda_env_vars = {
    SSM_PRIVATE_KEY_PARAMETER_NAME = local.apim_private_key_ssm_parameter_name
    KEYSTORE_S3_BUCKET             = local.apim_keystore_s3_bucket
    ENVIRONMENT                    = var.environment
  }
}

data "aws_iam_policy_document" "lambda_apim_key_generation" {
  statement {
    sid    = "AllowS3List"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:PutObject"
    ]

    resources = [
      "arn:aws:s3:::${local.apim_keystore_s3_bucket}/*"
    ]
  }

  statement {
    sid    = "AllowSSMParam"
    effect = "Allow"

    actions = [
      "ssm:DeleteParameter",
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
      "ssm:PutParameter",
    ]

    resources = [
      "arn:aws:ssm:${var.region}:${var.aws_account_id}:parameter/${var.component}/${var.environment}/apim/*"
    ]
  }
}
