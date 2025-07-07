import { SQSClient } from '@aws-sdk/client-sqs';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { mock } from 'jest-mock-extended';
import { filterUnnotifiedEvents } from '../../app/event-filters';
import { transformEvent } from '../../app/event-transform';
import { parseSqsRecord } from '../../app/parse-cloud-event';
import { CloudEvent, SupplierStatusChangeEvent } from '../../domain/cloud-event';
import { NudgeCommand } from '../../domain/nudge-command';
import { createHandler } from '../../handler/sqs-handler';
import { SqsRepository } from '../../infra/SqsRepository';

const queue = 'SQS_COMMAND_QUEUE';

jest.mock('../../app/event-filters');
jest.mock('../../app/event-transform');
jest.mock('../../app/parse-cloud-event');
jest.mock('../../infra/SqsRepository');

const mockedParse = parseSqsRecord as jest.MockedFunction<typeof parseSqsRecord>;
const mockedFilter = filterUnnotifiedEvents as jest.MockedFunction<typeof filterUnnotifiedEvents>;
const mockedTransform = transformEvent as jest.MockedFunction<typeof transformEvent>;
const sqsRepository = new SqsRepository(mock<SQSClient>());

//Handler under test
const handler = createHandler({ sqsRepository, commandsQueueUrl: queue });

describe('Event to Command Transform Handler', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const command: NudgeCommand = {
    nhsNumber: '9999999786',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'test-client-id',
    supplierStatus: 'unnotified',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id'
  };

  const cloudEvent: CloudEvent = {
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
  }

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
      requestItemPlanId: 'request-item-plan-id'
    }
  }

  const unnotifiedSQSRecord: SQSRecord =
  {
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

  const sqsEvent = {
    Records: [
      unnotifiedSQSRecord
    ]
  }

  it('should parse, filter, transform and send command for valid event', async () => {
    const event = sqsEvent;

    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValue(command);

    await handler(event);

    expect(mockedParse).toHaveBeenCalledWith(unnotifiedSQSRecord);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent);
    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);
  });

  it('should skip filtered-out events', async () => {
    const event = sqsEvent;

    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(false);

    await handler(event);

    expect(mockedTransform).not.toHaveBeenCalled();
    expect(sqsRepository.send).not.toHaveBeenCalled();
  });

  it('should handle multiple records', async () => {
    const statusChangeEvent2 = {
      ...statusChangeEvent,
      id: 'id-2',
      data: {
        ...statusChangeEvent.data,
        nhsNumber: '9999999787'
      }
    };

    const unnotifiedSQSRecord2 = {
      ...unnotifiedSQSRecord,
      messageId: '2',
      body: JSON.stringify(statusChangeEvent2)
    };

    const command2 = {
      ...command,
      nhsNumber: statusChangeEvent2.data.nhsNumber
    };

    const multiEvent: SQSEvent = {
      Records: [
        unnotifiedSQSRecord,
        unnotifiedSQSRecord2
      ]
    };

    mockedParse.mockReturnValueOnce(statusChangeEvent).mockReturnValueOnce(statusChangeEvent2);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValueOnce(command).mockReturnValueOnce(command2);

    await handler(multiEvent);

    expect(sqsRepository.send).toHaveBeenCalledTimes(2);

    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[0]);
    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[1]);

    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent2);

    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent);
    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent2);

    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command2);
  });

  it('should handle no records gracefully', async () => {
    await expect(handler({ Records: [] })).resolves.not.toThrow();
    expect(sqsRepository.send).not.toHaveBeenCalled();
  });

  it('should raise an error if parsing fails', async () => {

  });

});
