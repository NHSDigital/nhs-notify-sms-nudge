resource "aws_cloudwatch_event_rule" "inbound_event" {
  name           = "${local.csi}-inbound-event"
  description    = "Route inbound unnotified status events to SQS"
  event_bus_name = local.eventbus.data_plane_event_bus["name"]

  event_pattern = jsonencode({
    "detail": {
      "type": [
        "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1"
      ],
      "plane": [
        "data"
      ]
    }
  })
}
