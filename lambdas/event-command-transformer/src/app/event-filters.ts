import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { Logger } from 'nhs-notify-sms-nudge-utils';

const expectedTypes = new Set([
  'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
]);

export const filterUnnotifiedEvents = (
  event: SupplierStatusChangeEvent,
  logger: Logger,
): boolean => {
  if (!expectedTypes.has(event.type)) {
    logger.warn('Skipping event. Unexpected event type', {
      cloudEventId: event.id,
      cloudEventType: event.type,
      cloudData: {
        delayedFallback: event.data.delayedFallback,
      },
    });
    return false;
  }

  if (event.data.delayedFallback !== true) {
    logger.info('Skipping event. Not delayed fallback', {
      cloudEventId: event.id,
      cloudEventType: event.type,
      cloudData: {
        delayedFallback: event.data.delayedFallback,
      },
    });
    return false;
  }

  logger.info('Parsed Cloud Event Successfully', {
    cloudEventId: event.id,
    cloudEventType: event.type,
  });

  return true;
};
