import { SQSClient } from '@aws-sdk/client-sqs';
import { filterUnnotifiedEvents } from 'app/event-filters';
import { transformEvent } from 'app/event-transform';
import { parseSqsRecord } from 'app/parse-cloud-event';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { CloudEvent, SupplierStatusChangeEvent } from 'domain/cloud-event';
import { NudgeCommand } from 'domain/nudge-command';
import { createHandler } from 'handler/sqs-handler';
import { mock } from 'jest-mock-extended';
import { SqsRepository, logger } from 'nhs-notify-sms-nudge-utils';

const queue = 'SQS_COMMAND_QUEUE';

jest.mock('app/event-filters');
jest.mock('app/event-transform');
jest.mock('app/parse-cloud-event');
jest.mock('nhs-notify-sms-nudge-utils');

const mockedParse = parseSqsRecord as jest.Mock;
const mockedFilter = filterUnnotifiedEvents as jest.Mock;
const mockedTransform = transformEvent as jest.Mock;
const sqsRepository = new SqsRepository(mock<SQSClient>());
const mockLogger = jest.mocked(logger);

// Handler under test
const handler = createHandler({
  sqsRepository,
  commandsQueueUrl: queue,
  logger: mockLogger,
});

describe('Event to Command Transform Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const command: NudgeCommand = {
    sourceEventId: 'event-id',
    nhsNumber: '9999999786',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'test-client-id',
    supplierStatus: 'unnotified',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id',
  };

  const cloudEvent: CloudEvent = {
    id: 'event-id',
    source: '//nhs.notify.uk/supplier-status/env',
    specversion: '1.0',
    type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
    plane: 'data',
    subject: 'request-item-plan-id',
    time: '2025-07-03T14:23:30+0000',
    datacontenttype: 'application/json',
    dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
    dataschemaversion: '1.0.0',
  };

  const statusChangeEvent: SupplierStatusChangeEvent = {
    ...cloudEvent,
    data: {
      nhsNumber: '9999999786',
      delayedFallback: true,
      sendingGroupId: 'sending-group-id',
      clientId: 'client-id',
      supplierStatus: 'unnotified',
      previousSupplierStatus: 'received',
      requestItemId: 'request-item-id',
      requestItemPlanId: 'request-item-plan-id',
    },
  };

  const unnotifiedSQSRecord: SQSRecord = {
    messageId: 'message-id-1',
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

  const sqsEvent = {
    Records: [unnotifiedSQSRecord],
  };

  const statusChangeEvent2 = {
    ...statusChangeEvent,
    id: 'message-id-2',
    data: {
      ...statusChangeEvent.data,
      nhsNumber: '9999999787',
    },
  };

  const unnotifiedSQSRecord2 = {
    ...unnotifiedSQSRecord,
    messageId: 'message-id-2',
    body: JSON.stringify(statusChangeEvent2),
  };

  const command2 = {
    ...command,
    sourceEventId: statusChangeEvent2.id,
    nhsNumber: statusChangeEvent2.data.nhsNumber,
  };

  const multiEvent: SQSEvent = {
    Records: [unnotifiedSQSRecord, unnotifiedSQSRecord2],
  };

  it('should parse, filter, transform and send command for valid event', async () => {
    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValue(command);

    const result = await handler(sqsEvent);

    expect(mockedParse).toHaveBeenCalledWith(unnotifiedSQSRecord, mockLogger);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received SQS Event of 1 record(s)',
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Sending Nudge Command', {
      cloudEventId: 'event-id',
      requestItemId: 'request-item-id',
      requestItemPlanId: 'request-item-plan-id',
    });

    expect(result).toEqual({ batchItemFailures: [] });
  });

  it('should skip filtered-out events', async () => {
    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(false);

    const result = await handler(sqsEvent);

    expect(mockedTransform).not.toHaveBeenCalled();
    expect(sqsRepository.send).not.toHaveBeenCalled();

    expect(result).toEqual({ batchItemFailures: [] });
  });

  it('should handle multiple records', async () => {
    mockedParse
      .mockReturnValueOnce(statusChangeEvent)
      .mockReturnValueOnce(statusChangeEvent2);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValueOnce(command).mockReturnValueOnce(command2);

    const result = await handler(multiEvent);

    expect(sqsRepository.send).toHaveBeenCalledTimes(2);

    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[0], mockLogger);
    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[1], mockLogger);

    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent2, mockLogger);

    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedTransform).toHaveBeenCalledWith(
      statusChangeEvent2,
      mockLogger,
    );

    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command2);

    expect(result).toEqual({ batchItemFailures: [] });
  });

  it('should return failed items to the queue if an error occurs while processing them', async () => {
    mockedParse.mockImplementation((record) => {
      if (record.messageId === 'message-id-1') throw new Error('Test Error');
      return statusChangeEvent2;
    });

    const result = await handler(multiEvent);

    expect(mockLogger.warn).toHaveBeenCalledWith({
      error: 'Test Error',
      description: 'Failed processing record',
      messageId: 'message-id-1',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      '1 of 2 records processed successfully',
    );

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: 'message-id-1' }],
    });
  });
});
