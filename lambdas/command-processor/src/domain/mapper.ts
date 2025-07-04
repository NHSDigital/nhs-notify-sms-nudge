import type { IncomingQueueMessage } from './incoming-queue-message';
import type { DataEvent } from './data-event';

export function mapQueueToDataEvent(
  msg: IncomingQueueMessage
): DataEvent {
  const billingReference = [
    msg.clientId,
    msg.campaignId,
    msg.billingReference
  ].filter(part => part?.trim()).join('-');

  const messageReference = `${msg.requestItemId.trim()}-${msg.requestItemPlanId.trim()}`;

  return {
    routingPlanId: 'fc4f8c6b-1547-4216-9237-c7027c97ae60',
    messageReference,
    billingReference,
    recipient: {
      nhsNumber: msg.nhsNumber,
    },
    personalisation: {},
  };
}
