output "deployment" {
  description = "Deployment details used for post-deployment scripts"
  value = {
    aws_region     = var.region
    aws_account_id = var.aws_account_id
    project        = var.project
    environment    = var.environment
    group          = var.group
    component      = var.component
  }
}

# CloudWatch Anomaly Detection Alarm
output "inbound_event_subscriber_anomaly_alarm" {
  description = "Inbound event subscriber anomaly detection alarm details"
  value = var.enable_event_anomaly_detection ? {
    arn  = aws_cloudwatch_metric_alarm.inbound_event_subscriber_anomaly[0].arn
    name = aws_cloudwatch_metric_alarm.inbound_event_subscriber_anomaly[0].alarm_name
  } : null
}
