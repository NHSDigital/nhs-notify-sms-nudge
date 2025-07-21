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
  clientId: 'test-client-id',
  campaignId: 'test-campaign-id',
  supplierStatus: 'unnotified',
  billingReference: 'test-billing-reference',
  previousSupplierStatus: 'received',
  requestItemId: 'request-item-id',
  requestItemPlanId: 'request-item-plan-id',
};

export const mockRequest: Request = {
  data: {
    type: 'Message',
    attributes: {
      routingPlanId: ROUTING_PLAN_ID,
      messageReference: 'request-item-id_request-item-plan-id',
      billingReference:
        'test-client-id_test-campaign-id_test-billing-reference',
      recipient: {
        nhsNumber: '9999999786',
      },
    },
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
