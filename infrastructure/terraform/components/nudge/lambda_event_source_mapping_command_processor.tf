resource "aws_lambda_event_source_mapping" "command_processor" {
  event_source_arn                   = module.sqs_command.sqs_queue_arn
  function_name                      = module.lambda_command_processor.function_name
  batch_size                         = var.queue_batch_size
  maximum_batching_window_in_seconds = var.queue_batch_window_seconds
  function_response_types = [
    "ReportBatchItemFailures"
  ]

  scaling_config {
    maximum_concurrency = 20
  }
}
