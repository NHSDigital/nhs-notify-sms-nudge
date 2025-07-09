import { Logger } from "nhs-notify-sms-nudge-utils/logger";
import { SupplierStatusChangeEvent } from "src/domain/cloud-event";
import { NudgeCommand } from "src/domain/nudge-command";

export const transformEvent = (
  event: SupplierStatusChangeEvent,
  logger: Logger,
): NudgeCommand => {
  logger.info("Creating nudge command for event ID: %s", event.id);
  return {
    sourceEventId: event.id,
    ...event.data,
  };
};
