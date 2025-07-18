import type { Request } from 'domain/request';
import type { NudgeCommand } from 'domain/nudge-command';
import type { SQSRecord } from 'aws-lambda';
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { ROUTING_PLAN_ID } from '../constants';

export const mockNudgeCommand: NudgeCommand = {
  sourceEventId: 'test-event-id',
  nhsNumber: '9999999786',
  delayedFallback: true,
  sendingGroupId: 'sending-group-id',
  clientId: 'test_client_id',
  campaignId: 'test_campaign_id',
  supplierStatus: 'unnotified',
  billingReference: 'test_billing_reference',
  previousSupplierStatus: 'received',
  requestItemId: 'request_item_id',
  requestItemPlanId: 'request_item_plan_id',
};

export const mockRequest: Request = {
  routingPlanId: ROUTING_PLAN_ID,
  messageReference: 'request_item_id-request_item_plan_id',
  billingReference: 'test_client_id-test_campaign_id-test_billing_reference',
  recipient: {
    nhsNumber: '9999999786',
  },
};

export const sqsRecord: SQSRecord = {
  messageId: '1',
  receiptHandle: 'abc',
  body: JSON.stringify(mockNudgeCommand),
  attributes: {
    ApproximateReceiveCount: '1',
    SentTimestamp: '2025-07-03T14:23:30Z',
    SenderId: 'sender-id',
    ApproximateFirstReceiveTimestamp: '2025-07-03T14:23:30Z',
  },
  messageAttributes: {},
  md5OfBody: '',
  eventSource: 'aws:sqs',
  eventSourceARN: '',
  awsRegion: '',
};
