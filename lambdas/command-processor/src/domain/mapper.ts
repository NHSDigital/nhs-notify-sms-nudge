import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { NudgeCommand } from 'domain/nudge-command';
import type { Request } from 'domain/request';
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { ROUTING_PLAN_ID } from '../constants';

export function mapQueueToRequest(command: NudgeCommand): Request {
  const messageReference = `${command.requestItemId.trim()}-${command.requestItemPlanId.trim()}`;

  logger.info(`Mapping sqsEvent ${messageReference} to request`);

  const billingReference = [
    command.clientId,
    command.campaignId,
    command.billingReference,
  ]
    .filter((part) => part?.trim())
    .join('-');

  const request: Request = {
    data: {
      type: 'Message',
      attributes: {
        routingPlanId: ROUTING_PLAN_ID,
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
