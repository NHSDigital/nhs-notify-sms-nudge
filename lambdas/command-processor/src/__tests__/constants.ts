import type {
  SingleMessageRequest,
  SingleMessageResponse,
} from 'domain/request';
import type { NudgeCommand } from 'domain/nudge-command';
import type { SQSEvent, SQSRecord } from 'aws-lambda';

export const mockNudgeCommand1: NudgeCommand = {
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

export const mockNudgeCommand2 = {
  ...mockNudgeCommand1,
  nhsNumber: '9999999788',
};

export const mockRoutingPlanId = 'routing-plan-id';

export const mockRequest1: SingleMessageRequest = {
  data: {
    type: 'Message',
    attributes: {
      routingPlanId: mockRoutingPlanId,
      messageReference: 'request-item-id_request-item-plan-id',
      billingReference:
        'test-client-id_test-campaign-id_test-billing-reference',
      recipient: {
        nhsNumber: '9999999786',
      },
    },
  },
};

export const mockRequest2 = {
  ...mockRequest1,
  recipient: {
    nhsNumber: '9999999788',
  },
};

export const mockResponse: SingleMessageResponse = {
  data: {
    type: 'Message',
    id: '30XcAOfwjq59r72AQTjxL4V7Heg',
    attributes: {
      messageReference: '6e6aca3f-9e83-4c37-8bc0-b2bb0b2c7e0d',
      messageStatus: 'created',
      timestamps: {
        created: '2025-07-29T08:20:13.408Z',
      },
      routingPlan: {
        id: 'fc4f8c6b-1547-4216-9237-c7027c97ae60',
        version: '4HMorh_sMD7kr98GL43u0KR3qZNik4dW',
        createdDate: '2025-07-23T10:34:13.000Z',
        name: 'SMS nudge V1.0',
      },
    },
    links: {
      self: 'https://some.url/comms/v1/messages/30XcAOfwjq59r72AQTjxL4V7Heg',
    },
  },
};

export const sqsRecord1: SQSRecord = {
  messageId: '1',
  receiptHandle: 'abc',
  body: JSON.stringify(mockNudgeCommand1),
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

export const sqsRecord2 = {
  ...sqsRecord1,
  messageId: '2',
};

export const singleRecordEvent: SQSEvent = {
  Records: [{ ...sqsRecord1, body: JSON.stringify(mockNudgeCommand1) }],
};

export const multiRecordEvent: SQSEvent = {
  Records: [
    { ...sqsRecord1, body: JSON.stringify(mockNudgeCommand1) },
    { ...sqsRecord2, body: JSON.stringify(mockNudgeCommand2) },
  ],
};
