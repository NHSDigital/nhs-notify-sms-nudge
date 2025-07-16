import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { NudgeCommand } from 'domain/nudge-command';
import { Logger } from 'nhs-notify-sms-nudge-utils';

export const transformEvent = (
  event: SupplierStatusChangeEvent,
  logger: Logger,
): NudgeCommand => {
  logger.info('Creating Nudge Command ', {
    cloudEventId: event.id,
  });
  return {
    sourceEventId: event.id,
    ...event.data,
  };
};
