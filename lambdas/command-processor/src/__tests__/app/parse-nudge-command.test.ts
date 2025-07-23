import { logger } from 'nhs-notify-sms-nudge-utils';
import { ZodError } from 'zod';
import { parseSqsRecord } from 'app/parse-nudge-command';
import { mockNudgeCommand, sqsRecord } from '__tests__/constants';

jest.mock('nhs-notify-sms-nudge-utils');
const mockLogger = jest.mocked(logger);

describe('parseSqsRecord', () => {
  it('parses a valid JSON string into mockRequest', () => {
    const result = parseSqsRecord(sqsRecord, mockLogger);

    expect(result).toEqual(mockNudgeCommand);
    expect(mockLogger.info).toHaveBeenCalledWith('Parsing SQS Record', {
      messageId: '1',
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Parsed SQS Record as Nudge Command Event',
      {
        messageId: '1',
        sourceEventId: 'test-event-id',
      },
    );
  });

  it('throws error when body contains malformed JSON', () => {
    // Missing comma at the end of supplierStatus
    const badStatusUpdateJson = `{
      "nhsNumber": "9999999786",
      "delayedFallback": true,
      "sendingGroupId": "sending-group-id",
      "clientId": "test-client-id",
      "supplierStatus": "unnotified"
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

    expect(() => parseSqsRecord(badRecord, mockLogger)).toThrow(ZodError);
  });
});
