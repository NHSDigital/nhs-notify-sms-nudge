import { SQSClient } from '@aws-sdk/client-sqs';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { mock } from 'jest-mock-extended';
import { filterUnnotifiedEvents } from '../../app/event-filters';
import { transformEvent } from '../../app/event-transform';
import { parseSqsRecord } from '../../app/parse-cloud-event';
import { NudgeCommand } from '../../domain/nudge-command';
import { createHandler } from '../../handler/sqs-handler';
import { SqsRepository } from '../../infra/SqsRepository';

const mSqsClient = mock<SQSClient>();
const sqsRepository = new SqsRepository(mSqsClient);

const queue = 'SQS_COMMAND_QUEUE';

const mockedParse = parseSqsRecord as jest.Mock;
const mockedFilter = filterUnnotifiedEvents as jest.Mock;
const mockedTransform = transformEvent as jest.Mock;

//Handler under test
const handler = createHandler({ sqsRepository, commandsQueueUrl: queue });

describe('Event to Command Transform Handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createSQSRecord = (body: string): SQSRecord => (
    {
      messageId: '1',
      receiptHandle: 'abc',
      body,
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
    }
  );

  const createSQSEventMulti = (records: SQSRecord[]): SQSEvent => ({
    Records: [
      ...records
    ],
  });

  const createSQSEvent = (body: string): SQSEvent => ({
    Records: [
      createSQSRecord(body)
    ],
  });

  const command: NudgeCommand = {
    nhsNumber: 'nhs-number',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'client-id',
    supplierStatus: 'unnotified',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id'
  };

  it('should parse, filter, transform and send command for valid event', async () => {
    const body = '{ id: test-body }';
    const event = createSQSEvent(body);

    const parsed = body;
    const transformed = command;

    mockedParse.mockReturnValue(parsed);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValue(transformed);

    await handler(event);

    expect(mockedParse).toHaveBeenCalledWith(event.Records[0]);
    expect(mockedFilter).toHaveBeenCalledWith(parsed);
    expect(mockedTransform).toHaveBeenCalledWith(parsed);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, transformed);
  });

  it('should skip filtered-out events', async () => {
    const body = '{ id: test-body }';
    const event = createSQSEvent(body);

    mockedParse.mockReturnValue(body);
    mockedFilter.mockReturnValue(false);

    await handler(event);

    expect(mockedTransform).not.toHaveBeenCalled();
    expect(sqsRepository.send).not.toHaveBeenCalled();
  });

  it('should handle multiple records', async () => {
    const multiEvent: SQSEvent = {
      Records: [
        createSQSEvent('id: test-body-1').Records[0],
        createSQSEvent('id: test-body-2').Records[0],
      ],
    };

    mockedParse.mockImplementation((record: SQSRecord) => ({ parsed: record.body }));
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockImplementation((e) => ({ command: `cmd-${e.parsed}` }));

    await handler(multiEvent);

    expect(sqsRepository.send).toHaveBeenCalledTimes(2);
  });

  it('should handle no records gracefully', async () => {
    await expect(handler({ Records: [] })).resolves.not.toThrow();
    expect(sqsRepository.send).not.toHaveBeenCalled();
  });

  it('should raise an error if parsing fails', async () => {

  });

});
