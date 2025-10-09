import {
  BatchResultErrorEntry,
  SendMessageBatchCommand,
} from '@aws-sdk/client-sqs';
import { fakeEvent } from '__tests__/helpers/fake-event';
import { mock } from 'jest-mock-extended';
import { sendEventsToSqs } from 'send-events-to-sqs';
import { SupplierStatusEvent } from 'types';

const accountId = '257995483745';
const environment = 'dev';

const mockSqsClient = { send: jest.fn() };
jest.mock('@aws-sdk/client-sqs', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-sqs');

  return {
    __esModule: true,
    ...originalModule,
    SQSClient: jest.fn(() => mockSqsClient),
  };
});

const mockStsClient = {
  send: jest.fn(() => {
    return {
      Account: accountId,
    };
  }),
};
jest.mock('@aws-sdk/client-sts', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-sts');

  return {
    __esModule: true,
    ...originalModule,
    STSClient: jest.fn(() => mockStsClient),
  };
});

const successfulSendResponse = {
  Failed: [],
  Successful: [mock<BatchResultErrorEntry>()],
};

describe('sendEventsToSqs', () => {
  beforeEach(() => {
    mockSqsClient.send.mockReset();
  });

  it('should send the expected request to SQS', async () => {
    mockSqsClient.send.mockResolvedValue(successfulSendResponse);

    await sendEventsToSqs(environment, [fakeEvent], 5);

    expect(mockSqsClient.send).toHaveBeenCalled();
    const sendMessageBatchCommand: SendMessageBatchCommand =
      mockSqsClient.send.mock.calls[0][0];
    expect(sendMessageBatchCommand.input.QueueUrl).toBe(
      `https://sqs.eu-west-2.amazonaws.com/${accountId}/nhs-${environment}-nudge-inbound-event-queue`,
    );
    expect(sendMessageBatchCommand.input.Entries).toStrictEqual([
      {
        Id: fakeEvent.id,
        MessageBody: JSON.stringify(fakeEvent),
      },
    ]);
  });

  it('should send a request for each batch of messages', async () => {
    const events: SupplierStatusEvent[] = Array.from(
      {
        length: 52,
      },
      () => fakeEvent,
    );
    mockSqsClient.send.mockResolvedValue(successfulSendResponse);

    await sendEventsToSqs(environment, events, 5);

    // Batch size is 10, so 52 events = 6 batches.
    expect(mockSqsClient.send).toHaveBeenCalledTimes(6);
  });

  it('should continue sending batches if an error is raised', async () => {
    mockSqsClient.send.mockRejectedValueOnce(
      new Error('Something went wrong!'),
    );
    mockSqsClient.send.mockResolvedValue(successfulSendResponse);

    const events: SupplierStatusEvent[] = Array.from(
      {
        length: 30,
      },
      () => fakeEvent,
    );

    await sendEventsToSqs(environment, events, 5);

    // Batch size is 10, so 30 events = 3 batches.
    expect(mockSqsClient.send).toHaveBeenCalledTimes(3);
  });

  it('should continue sending batches if one fails', async () => {
    mockSqsClient.send.mockResolvedValueOnce({
      Failed: [mock<BatchResultErrorEntry>()],
    });
    mockSqsClient.send.mockResolvedValue(successfulSendResponse);

    const events: SupplierStatusEvent[] = Array.from(
      {
        length: 30,
      },
      () => fakeEvent,
    );

    await sendEventsToSqs(environment, events, 5);

    // Batch size is 10, so 30 events = 3 batches.
    expect(mockSqsClient.send).toHaveBeenCalledTimes(3);
  });

  it('should continue sending batches if an empty response is received', async () => {
    mockSqsClient.send.mockResolvedValue({});
    const events: SupplierStatusEvent[] = Array.from(
      {
        length: 30,
      },
      () => fakeEvent,
    );

    await sendEventsToSqs(environment, events, 5);

    // Batch size is 10, so 30 events = 3 batches.
    expect(mockSqsClient.send).toHaveBeenCalledTimes(3);
  });
});
