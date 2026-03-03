resource "aws_cloudwatch_metric_alarm" "inbound_event_subscriber_anomaly" {
  count = var.enable_event_anomaly_detection ? 1 : 0

  alarm_name          = "${local.csi}-inbound-event-subscriber-anomaly"
  alarm_description   = "ANOMALY: Detects anomalous patterns in messages received from the inbound event queue"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = var.event_anomaly_evaluation_periods
  threshold_metric_id = "ad1"
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "m1"
    return_data = true

    metric {
      metric_name = "NumberOfMessagesReceived"
      namespace   = "AWS/SQS"
      period      = var.event_anomaly_period
      stat        = "Sum"

      dimensions = {
        QueueName = module.sqs_inbound_event.sqs_queue_name
      }
    }
  }

  metric_query {
    id          = "ad1"
    expression  = "ANOMALY_DETECTION_BAND(m1, ${var.event_anomaly_band_width})"
    label       = "NumberOfMessagesReceived (expected)"
    return_data = true
  }

  tags = merge(
    var.default_tags,
    {
      Name = "${local.csi}-inbound-event-subscriber-anomaly"
    }
  )
}
