resource "aws_lambda_event_source_mapping" "command_processor" {
  event_source_arn = module.sqs_command.sqs_queue_arn
  function_name    = module.lambda_command_processor.function_name
}
