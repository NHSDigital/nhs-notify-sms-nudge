import { parseSqsRecord } from 'app/parse-cloud-event';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { ZodError } from 'zod';

const statusChangeEvent = {
  id: 'id',
  source: '//nhs.notify.uk/supplier-status/env',
  specversion: '1.0',
  type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
  plane: 'data',
  subject: 'request-item-plan-id',
  time: '2025-07-03T14:23:30+0000',
  datacontenttype: 'application/json',
  dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
  dataschemaversion: '1.0.0',
  data: {
    nhsNumber: '9999999786',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'test-client-id',
    supplierStatus: 'unnotified',
    previousSupplierStatus: 'received',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id',
  },
};

const sqsRecord = {
  messageId: '1',
  receiptHandle: 'abc',
  body: JSON.stringify(statusChangeEvent),
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

jest.mock('nhs-notify-sms-nudge-utils');
const mockLogger = jest.mocked(logger);

describe('parseSqsRecord', () => {
  it('parses a valid JSON string into SupplierStatusChangeEvent', () => {
    const result = parseSqsRecord(sqsRecord, mockLogger);

    expect(result).toEqual(statusChangeEvent);
    expect(mockLogger.info).toHaveBeenCalledWith('Parsing SQS Record', {
      messageId: '1',
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Parsed SQS Record as Supplier Status Change Event',
      {
        cloudEventId: 'id',
        cloudEventSpecVersion: '1.0',
        cloudEventType: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
        messageId: '1',
      },
    );
  });

  it('throws error when body contains malformed JSON', () => {
    // Missing closing brace for data property
    const badStatusUpdateJson = `{
      "id": "id",
      "source": "//nhs.notify.uk/supplier-status/env",
      "specversion": "1.0",
      "type": "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
      "plane": "data",
      "subject": "request-item-plan-id",
      "time": "2025-07-03T14:23:30+0000",
      "datacontenttype": "application/json",
      "dataschema": "https://notify.nhs.uk/events/schemas/supplier-status/v1.json",
      "dataschemaversion": "1.0.0",
      "data": {
        "nhsNumber": "9999999786",
        "delayedFallback": true,
        "sendingGroupId": "sending-group-id",
        "clientId": "test-client-id",
        "supplierStatus": "unnotified",
        "previousSupplierStatus": "received",
        "requestItemId": "request-item-id",
        "requestItemPlanId": "request-item-plan-id"
    }`;

    const badRecord = {
      ...sqsRecord,
      body: badStatusUpdateJson,
    };

    expect(() => parseSqsRecord(badRecord, mockLogger)).toThrow(SyntaxError);
  });

  it('throws an error if required properties are missing', () => {
    // nhsNumber has been removed - the JSON is Valid but the event is not
    const badStatusUpdateJson = `{
      "id": "id",
      "source": "//nhs.notify.uk/supplier-status/env",
      "specversion": "1.0",
      "type": "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
      "plane": "data",
      "subject": "request-item-plan-id",
      "time": "2025-07-03T14:23:30+0000",
      "datacontenttype": "application/json",
      "dataschema": "https://notify.nhs.uk/events/schemas/supplier-status/v1.json",
      "dataschemaversion": "1.0.0",
      "data": {
        "delayedFallback": true,
        "sendingGroupId": "sending-group-id",
        "clientId": "test-client-id",
        "supplierStatus": "unnotified",
        "previousSupplierStatus": "received",
        "requestItemId": "request-item-id",
        "requestItemPlanId": "request-item-plan-id"
      }
    }`;

    const badRecord = {
      ...sqsRecord,
      body: badStatusUpdateJson,
    };

    expect(() => parseSqsRecord(badRecord, mockLogger)).toThrow(ZodError);
  });
});
