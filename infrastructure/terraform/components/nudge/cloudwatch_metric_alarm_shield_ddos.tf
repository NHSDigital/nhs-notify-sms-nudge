resource "aws_cloudwatch_metric_alarm" "shield_ddos" {
  count    = var.csoc_log_forwarding ? 1 : 0
  provider = aws.us-east-1

  alarm_name          = "${local.csi}-shield-ddos-cdn"
  alarm_description   = "SHIELD: Triggers when a DDoS attack is detected on the CDN CloudFront distribution"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 20
  metric_name         = "DDoSDetected"
  namespace           = "AWS/DDoSProtection"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  datapoints_to_alarm = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    ResourceArn = aws_cloudfront_distribution.static_assets_hosting.arn
  }
}
