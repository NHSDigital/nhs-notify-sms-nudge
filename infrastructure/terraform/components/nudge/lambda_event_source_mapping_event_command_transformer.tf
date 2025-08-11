resource "aws_lambda_event_source_mapping" "event_command_transformer" {
  event_source_arn                   = module.sqs_inbound_event.sqs_queue_arn
  function_name                      = module.lambda_event_command_transformer.function_name
  batch_size                         = var.queue_batch_size
  maximum_batching_window_in_seconds = var.queue_batch_window_seconds
}
