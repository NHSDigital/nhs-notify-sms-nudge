import type { Request } from '../../domain/request';
import type { NudgeCommand } from '../../domain/nudge-command';
import { ROUTING_PLAN_ID } from '../../constants';

// “Minimal valid” payload for your tests—you can add variations here later
export const expectedNudgeCommand: NudgeCommand = {
  nhsNumber: '9999999786',
  delayedFallback: true,
  sendingGroupId: 'sending-group-id',
  clientId: 'test_client_id',
  campaignId: 'test_campaign_id',
  supplierStatus: 'unnotified',
  billingReference: 'test_billing_reference',
  previousSupplierStatus: 'received',
  requestItemId: 'request_item_id',
  requestItemPlanId: 'request_item_plan_id'
}

export const expectedRequest: Request = {
  routingPlanId: ROUTING_PLAN_ID,
  messageReference: 'request_item_id-request_item_plan_id',
  billingReference: 'test_client_id-test_campaign_id-test_billing_reference',
  recipient: {
    nhsNumber: '9999999786'
  },
  personalisation: {}
}

