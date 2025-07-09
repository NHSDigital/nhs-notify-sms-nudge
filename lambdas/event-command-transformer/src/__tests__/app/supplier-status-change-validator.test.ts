import { $SupplierStatusChange } from "src/app/supplier-status-change-validator";

describe("Supplier Status Change Validator Schema", () => {
  const validEvent = {
    id: "id",
    source: "//nhs.notify.uk/supplier-status/env",
    specversion: "1.0",
    type: "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
    plane: "data",
    subject: "request-item-plan-id",
    time: "2025-07-03T14:23:30+0000",
    datacontenttype: "application/json",
    dataschema: "https://notify.nhs.uk/events/schemas/supplier-status/v1.json",
    dataschemaversion: "1.0.0",
    data: {
      nhsNumber: "9999999786",
      delayedFallback: true,
      sendingGroupId: "sending-group-id",
      clientId: "test-client-id",
      supplierStatus: "unnotified",
      previousSupplierStatus: "received",
      requestItemId: "request-item-id",
      requestItemPlanId: "request-item-plan-id",
    },
  };

  it("should parse a valid event", () => {
    const result = $SupplierStatusChange.safeParse(validEvent);
    expect(result.success).toBeTruthy();
  });

  it("should error a valid event", () => {
    const invalidEvent = {
      ...validEvent,
      data: {},
    };
    const result = $SupplierStatusChange.safeParse(invalidEvent);
    expect(result.success).toBeFalsy();
    expect(result.error).toBeTruthy();
  });
});
