locals {
  aws_lambda_functions_dir_path = "../../../../lambdas"

  is_sandbox = can(regex("sandbox", var.send_message_url))
}
