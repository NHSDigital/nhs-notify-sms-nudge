resource "aws_cloudwatch_event_rule" "inbound_event" {
  name           = "${local.csi}-inbound-event"
  description    = "Route inbound unnotified status events to SQS"
  event_bus_name = local.eventbus.data_plane_event_bus["name"]

  event_pattern = jsonencode({
    "detail": {
      "source": [
        "//nhs.notify.uk/supplier-status/${var.core_environment}" ## For testing purposes only. Probably shouldn't be scoped to a specific environment
      ]
    }
  })
}
