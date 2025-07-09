import type { NudgeCommand } from './nudge-command';
import type { Request } from './request';
import { ROUTING_PLAN_ID } from '../constants'

export function mapQueueToRequest(
  msg: NudgeCommand
): Request {
  const billingReference = [
    msg.clientId,
    msg.campaignId,
    msg.billingReference
  ].filter(part => part?.trim()).join('-');

  const messageReference = `${msg.requestItemId.trim()}-${msg.requestItemPlanId.trim()}`;

  return {
    routingPlanId: ROUTING_PLAN_ID,
    messageReference,
    billingReference,
    recipient: {
      nhsNumber: msg.nhsNumber,
    },
    personalisation: {},
  };
}
