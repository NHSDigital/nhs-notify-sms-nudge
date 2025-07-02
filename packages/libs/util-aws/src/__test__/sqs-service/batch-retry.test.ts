import { createMockLogger } from '@comms/util-logger';
import { SQSClient } from '@aws-sdk/client-sqs';
import {
  BatchDeleteMessage,
  BatchRetry,
  BatchSendMessage,
  BatchSetVisibility,
} from '../../sqsService';

type MockResult = {
  Id: string;
  message: string;
};

type MockFailure = {
  Id: string;
  message: string;
};

type MockEntry = {
  Id?: string;
  message: string;
};

type MockCommandInput = {
  QueueUrl: string | undefined;
  Entries: MockEntry[] | undefined;
};

class MockSendCommand {
  constructor(public input: MockCommandInput) {}
}

function mockMessages(count: number): MockEntry[] {
  return Array(count)
    .fill(null)
    .map((_, index) => ({
      Id: `id-${index}`,
      message: `id-${index} says hello`,
    }));
}

function mockSuccess(successfulIds: number[]) {
  return successfulIds.map(
    (id): MockResult => ({
      Id: `id-${id}`,
      message: `id-${id} success`,
    })
  );
}

function mockFailed(failedIds: number[]) {
  return failedIds.map(
    (id): MockFailure => ({
      Id: `id-${id}`,
      message: `id-${id} failure`,
    })
  );
}

function mockSendResult(
  successfulIds: number[] = [],
  failedIds: number[] = []
) {
  return {
    Successful: mockSuccess(successfulIds),
    Failed: mockFailed(failedIds),
  };
}

describe('BatchRetry', () => {
  const mockLogger = createMockLogger();
  const mockSend = jest.fn();

  const mockSleep = jest.fn();
  mockSleep.mockResolvedValue(null);

  const batchRetry = new BatchRetry<
    MockSendCommand,
    MockCommandInput,
    MockEntry,
    MockResult,
    MockFailure
  >(mockSend, MockSendCommand, mockLogger.logger, 3, mockSleep);

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.reset();
  });

  test('batch sends when no failures', async () => {
    mockSend.mockResolvedValueOnce(mockSendResult([0, 1]));

    const messages = mockMessages(2);

    const result = await batchRetry.execute({
      QueueUrl: 'queue-url-123',
      Entries: messages,
    });

    expect(result.Successful?.length).toBe(2);
    expect(result.Failed?.length).toBe(0);
    expect(result.Successful).toEqual(
      expect.arrayContaining(mockSuccess([0, 1]))
    );

    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'queue-url-123',
          Entries: messages,
        },
      })
    );
  });

  test('throws if Id is missing from input', async () => {
    const messages: MockEntry[] = [
      {
        message: 'message with no Id',
      },
    ];
    await expect(
      batchRetry.execute({
        QueueUrl: 'queue-url-123',
        Entries: messages,
      })
    ).rejects.toThrowError('All messages in a batch must hava a valid Id');
  });

  test("throws if returned successes don't match input", async () => {
    mockSend.mockReturnValueOnce(mockSendResult([6]));

    const messages = mockMessages(1);
    await expect(
      batchRetry.execute({
        QueueUrl: 'queue-url-123',
        Entries: messages,
      })
    ).rejects.toThrowError('Unable to locate batch entry');
  });

  test("throws if returned failures don't match input", async () => {
    mockSend.mockReturnValueOnce(mockSendResult([], [6]));

    const messages = mockMessages(1);
    await expect(
      batchRetry.execute({
        QueueUrl: 'queue-url-123',
        Entries: messages,
      })
    ).rejects.toThrowError('Unable to locate batch entry');
  });

  test('retries failed entries until success', async () => {
    mockSend.mockReturnValueOnce(mockSendResult([2, 3], [0, 1]));
    mockSend.mockReturnValueOnce(mockSendResult([0], [1]));
    mockSend.mockReturnValueOnce(mockSendResult([1]));

    const messages = mockMessages(4);
    const result = await batchRetry.execute(
      { QueueUrl: 'queue-url-123', Entries: messages },
      4
    );

    expect(result.Successful?.length).toBe(4);
    expect(result.Failed?.length).toBe(0);
    expect(result.Successful).toEqual(
      expect.arrayContaining(mockSuccess([0, 1, 2, 3]))
    );

    expect(mockSend).toBeCalledTimes(3);
    expect(mockSend.mock.calls[0][0].input.Entries.length).toBe(4);
    expect(mockSend.mock.calls[1][0].input.Entries.length).toBe(2);
    expect(mockSend.mock.calls[2][0].input.Entries.length).toBe(1);
  });

  test('retries SQS client errors', async () => {
    const errorMessage = 'client error';
    mockSend.mockRejectedValueOnce(new Error(errorMessage));
    mockSend.mockReturnValueOnce(mockSendResult([0], []));

    const messages = mockMessages(1);
    const result = await batchRetry.execute(
      { QueueUrl: 'queue-url-123', Entries: messages },
      4
    );

    expect(result.Successful?.length).toBe(1);
    expect(result.Failed?.length).toBe(0);

    expect(mockSend).toBeCalledTimes(2);

    expect(mockLogger.messages).toContainEqual({
      batchSize: 4,
      inputEntries: 1,
      command: 'MockSendCommand',
      description: 'Failed batch operation',
      err: expect.objectContaining({ message: errorMessage }),
      level: 'error',
    });
  });

  test('reports failed items after retries exceeded', async () => {
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));

    const messages = mockMessages(1);
    const result = await batchRetry.execute({
      QueueUrl: 'queue-url-123',
      Entries: messages,
    });

    expect(result.Successful?.length).toBe(0);
    expect(result.Failed).toEqual(expect.arrayContaining(mockFailed([0])));
  });

  test('throws if unprocessed item lacks an Id property', async () => {
    mockSend.mockReturnValueOnce({
      Successful: [],
      Failed: [{ message: 'msg_without_id' }],
    });

    const messages = mockMessages(1);
    await expect(
      batchRetry.execute({ QueueUrl: 'queue-url-123', Entries: messages }, 1)
    ).rejects.toThrowError('Id not found for batch entry');
  });

  test('splits large batches', async () => {
    mockSend.mockReturnValueOnce(mockSendResult([0, 1, 2, 3]));
    mockSend.mockReturnValueOnce(mockSendResult([4, 5, 6, 7]));

    const messages = mockMessages(8);
    const result = await batchRetry.execute(
      { QueueUrl: 'queue-url-123', Entries: messages },
      4
    );

    expect(result.Successful?.length).toBe(8);
    expect(result.Failed?.length).toBe(0);
    expect(result.Successful).toEqual(
      expect.arrayContaining(mockSuccess([0, 1, 2, 3, 4, 5, 6, 7]))
    );

    expect(mockSend).toBeCalledTimes(2);
    expect(mockSend.mock.calls[0][0].input.Entries.length).toBe(4);
    expect(mockSend.mock.calls[1][0].input.Entries.length).toBe(4);
  });

  test('failed entries are merged into a new batch', async () => {
    mockSend.mockReturnValueOnce(mockSendResult([0, 1, 2], [3]));
    mockSend.mockReturnValueOnce(mockSendResult([4, 5, 6], [7]));
    mockSend.mockReturnValueOnce(mockSendResult([3, 7]));

    const messages = mockMessages(8);
    const result = await batchRetry.execute(
      { QueueUrl: 'queue-url-123', Entries: messages },
      4
    );

    expect(result.Successful?.length).toBe(8);
    expect(result.Failed?.length).toBe(0);
    expect(result.Successful).toEqual(
      expect.arrayContaining(mockSuccess([0, 1, 2, 3, 4, 5, 6, 7]))
    );

    expect(mockSend).toBeCalledTimes(3);
    expect(mockSend.mock.calls[0][0].input.Entries.length).toBe(4);
    expect(mockSend.mock.calls[1][0].input.Entries.length).toBe(4);
    expect(mockSend.mock.calls[2][0].input.Entries.length).toBe(2);
  });

  test('retries sleep between requests', async () => {
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));
    mockSend.mockReturnValueOnce(mockSendResult([], [0]));

    const messages = mockMessages(1);
    const result = await batchRetry.execute({
      QueueUrl: 'queue-url-123',
      Entries: messages,
    });

    expect(result.Successful?.length).toBe(0);
    expect(result.Failed?.length).toBe(1);

    expect(mockSend).toBeCalledTimes(3);
    expect(mockSleep).toBeCalledTimes(2);
    expect(mockSleep).toBeCalledWith(1000);
    expect(mockSleep).toBeCalledWith(2000);
  });

  test('throws if IDs on input are not unique', async () => {
    const messages = [
      {
        Id: '1',
        message: 'hello',
      },
      {
        Id: '1',
        message: 'world',
      },
    ];

    await expect(
      batchRetry.execute({ QueueUrl: 'queue-url-123', Entries: messages }, 1)
    ).rejects.toThrowError('All messages in a batch must hava a unique Id');
  });
});

describe('SQS batch operations', () => {
  const mockSqsSend = jest.fn();
  const mockSqsClient = jest.mocked({
    send: mockSqsSend,
  } as unknown as SQSClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('BatchSend', async () => {
    mockSqsSend.mockResolvedValueOnce(mockSuccess([1]));

    const send = new BatchSendMessage(mockSqsClient);
    await send.execute({
      QueueUrl: '111',
      Entries: [
        {
          Id: 'id-1',
          MessageBody: 'a',
        },
      ],
    });

    expect(mockSqsSend).toBeCalledTimes(1);
  });

  test('BatchSetVisibility', async () => {
    mockSqsSend.mockResolvedValueOnce(mockSuccess([1]));

    const send = new BatchSetVisibility(mockSqsClient);
    await send.execute({
      QueueUrl: '111',
      Entries: [
        {
          Id: 'id-1',
          ReceiptHandle: 'id-1',
          VisibilityTimeout: 10,
        },
      ],
    });

    expect(mockSqsSend).toBeCalledTimes(1);
  });

  test('BatchDelete', async () => {
    mockSqsSend.mockResolvedValueOnce(mockSuccess([1]));

    const send = new BatchDeleteMessage(mockSqsClient);
    await send.execute({
      QueueUrl: '111',
      Entries: [
        {
          Id: 'id-1',
          ReceiptHandle: 'id-1',
        },
      ],
    });

    expect(mockSqsSend).toBeCalledTimes(1);
  });
});
