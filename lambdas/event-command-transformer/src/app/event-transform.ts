import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { NudgeCommand } from 'domain/nudge-command';
import { Logger } from 'nhs-notify-sms-nudge-utils/logger';

export const transformEvent = (
  event: SupplierStatusChangeEvent,
  logger: Logger,
): NudgeCommand => {
  logger.info('Creating nudge command for event ID: %s', event.id);
  return {
    sourceEventId: event.id,
    ...event.data,
  };
};
