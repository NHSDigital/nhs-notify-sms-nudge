resource "aws_cloudwatch_event_target" "inbound" {
  rule           = aws_cloudwatch_event_rule.inbound_event.name
  arn            = module.sqs_inbound_event.sqs_queue_arn
  target_id      = "unnotified-events-target"
  event_bus_name = local.eventbus.data_plane_event_bus["name"]
}
