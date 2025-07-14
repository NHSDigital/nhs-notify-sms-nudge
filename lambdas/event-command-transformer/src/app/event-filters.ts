import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { Logger } from 'nhs-notify-sms-nudge-utils';

const expectedTypes = new Set([
  'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
]);

export const filterUnnotifiedEvents = (
  event: SupplierStatusChangeEvent,
  logger: Logger,
): boolean => {
  logger.info(`Parsing cloud event id: ${event.id}`);

  if (!expectedTypes.has(event.type)) {
    logger.warn(
      'Skipping event %s: Unexpected event type %s',
      event.id,
      event.type,
    );
    return false;
  }

  if (event.data.delayedFallback !== true) {
    logger.info('Skipping event %s: Not delayed fallback', event.id);
    return false;
  }

  return true;
};
