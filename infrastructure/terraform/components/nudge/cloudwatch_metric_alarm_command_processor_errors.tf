resource "aws_cloudwatch_metric_alarm" "command_processor_errors" {
  alarm_name          = "${local.csi}-event-command-transformer-errors"
  alarm_description   = "RELIABILITY: Alarm for Command Processor Lambda function errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  actions_enabled     = true
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.lambda_command_processor.function_name
  }
}
