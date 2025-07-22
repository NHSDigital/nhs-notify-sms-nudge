import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { NudgeCommand } from 'domain/nudge-command';
import type { Request } from 'domain/request';

export function mapQueueToRequest(
  command: NudgeCommand,
  routingPlanId: string,
): Request {
  const messageReference = `${command.requestItemId.trim()}_${command.requestItemPlanId.trim()}`;

  logger.info(`Mapping sqsEvent ${messageReference} to request`);

  const billingReference = [
    command.clientId,
    command.campaignId,
    command.billingReference,
  ]
    .filter((part) => part?.trim())
    .join('_');

  const request: Request = {
    data: {
      type: 'Message',
      attributes: {
        routingPlanId,
        messageReference,
        billingReference,
        recipient: {
          nhsNumber: command.nhsNumber,
        },
      },
    },
  };
  return request;
}
