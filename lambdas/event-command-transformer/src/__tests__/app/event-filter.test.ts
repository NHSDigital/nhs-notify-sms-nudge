import { logger } from "nhs-notify-sms-nudge-utils/logger";
import { filterUnnotifiedEvents } from "src/app/event-filters";
import { SupplierStatusChangeEvent } from "src/domain/cloud-event";

const statusChangeEvent: SupplierStatusChangeEvent = {
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

jest.mock("nhs-notify-sms-nudge-utils/logger");
const mockLogger = jest.mocked(logger);

describe("filterUnnotifiedEvents", () => {
  it("returns true for expected type and delayedFallback = true", () => {
    expect(filterUnnotifiedEvents(statusChangeEvent, mockLogger)).toBe(true);
  });

  it("returns false if type is not in expectedTypes", () => {
    const badTypeEvent = {
      ...statusChangeEvent,
      type: "uk.nhs.notify.channels.not.nhsapp.SupplierStatusChange.v1",
    };

    expect(filterUnnotifiedEvents(badTypeEvent, mockLogger)).toBe(false);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "Skipping event %s: Unexpected event type %s",
      badTypeEvent.id,
      badTypeEvent.type,
    );
  });

  it("returns false if delayedFallback is false", () => {
    const notDelayedEvent = {
      ...statusChangeEvent,
      data: {
        ...statusChangeEvent.data,
        delayedFallback: false,
      },
    };
    expect(filterUnnotifiedEvents(notDelayedEvent, mockLogger)).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Skipping event %s: Not delayed fallback",
      notDelayedEvent.id,
    );
  });

  it("returns false if delayedFallback is not defined", () => {
    const undefinedDelayedEvent = {
      ...statusChangeEvent,
      data: {
        ...statusChangeEvent.data,
      },
    };

    delete undefinedDelayedEvent.data.delayedFallback;

    expect(filterUnnotifiedEvents(undefinedDelayedEvent, mockLogger)).toBe(
      false,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Skipping event %s: Not delayed fallback",
      undefinedDelayedEvent.id,
    );
  });
});
