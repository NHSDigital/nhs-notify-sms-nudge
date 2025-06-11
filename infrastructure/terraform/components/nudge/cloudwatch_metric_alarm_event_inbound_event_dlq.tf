resource "aws_cloudwatch_metric_alarm" "sqs_inbound_event_dlq" {
  alarm_name          = "${local.csi}-inbound-event-dlq-messages"
  alarm_description   = "RELIABILITY: Alarm for messages in the Inbound Event DLQ"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  actions_enabled     = true
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = module.sqs_inbound_event.sqs_dlq_name
  }
}
