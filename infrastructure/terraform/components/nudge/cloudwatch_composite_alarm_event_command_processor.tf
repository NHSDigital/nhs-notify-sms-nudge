resource "aws_cloudwatch_composite_alarm" "composite" {

  depends_on = [
    aws_cloudwatch_metric_alarm.command_processor_errors,
    aws_cloudwatch_metric_alarm.sqs_command_dlq
  ]

  alarm_name        = "${local.csi}-command-processor-reliability"
  alarm_description = "RELIABILITY: Composite for the event to command processor component of SMS Nudge"

  actions_enabled = "false"
  alarm_actions   = []
  ok_actions      = []

  alarm_rule = join(" OR ", [
    "ALARM(\"${aws_cloudwatch_metric_alarm.command_processor_errors.alarm_name}\")",
    "ALARM(\"${aws_cloudwatch_metric_alarm.sqs_command_dlq.alarm_name}\")"
  ])
}
