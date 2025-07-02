import {
  GetQueueAttributesCommandOutput,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  BatchDeleteMessage,
  BatchSendMessage,
  BatchSetVisibility,
  SQSService,
} from '../../sqsService';

describe('SQSService', () => {
  const batchSend = jest.mocked({
    execute: jest.fn(),
  } as unknown as BatchSendMessage);
  const batchDelete = jest.mocked({
    execute: jest.fn(),
  } as unknown as BatchDeleteMessage);
  const batchVisibility = jest.mocked({
    execute: jest.fn(),
  } as unknown as BatchSetVisibility);

  const mockSqsSend = jest.fn();
  const mockSqsClient = jest.mocked({
    send: mockSqsSend,
  } as unknown as SQSClient);

  const sqsService = new SQSService(
    mockSqsClient,
    'https://sqs-queue/',
    batchDelete,
    batchSend,
    batchVisibility
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('delete - calls BatchDeleteMessage', async () => {
    await sqsService.delete('del', ['receipt-handle-del']);
    expect(batchDelete.execute).toBeCalledTimes(1);
    expect(batchDelete.execute).toBeCalledWith({
      QueueUrl: 'https://sqs-queue/del',
      Entries: [
        {
          Id: '0',
          ReceiptHandle: 'receipt-handle-del',
        },
      ],
    });
  });

  test('visibility - calls BatchSetVisibiltity', async () => {
    await sqsService.visibility('vis', ['receipt-handle-vis'], 17);
    expect(batchVisibility.execute).toBeCalledTimes(1);
    expect(batchVisibility.execute).toBeCalledWith({
      QueueUrl: 'https://sqs-queue/vis',
      Entries: [
        {
          Id: '0',
          ReceiptHandle: 'receipt-handle-vis',
          VisibilityTimeout: 17,
        },
      ],
    });
  });

  test('forward - calls BatchSendMessage - from fifo to fifo queue, MessageGroupId and MessageDeduplicationId reused', async () => {
    await sqsService.forward('send.fifo', [
      {
        MessageId: 'mid',
        Body: 'send-mesg-bod',
        Attributes: { MessageDeduplicationId: 'mid1', MessageGroupId: 'mid2' },
      },
    ]);
    expect(batchSend.execute).toBeCalledTimes(1);
    expect(batchSend.execute).toBeCalledWith({
      QueueUrl: 'https://sqs-queue/send.fifo',
      Entries: [
        {
          Id: 'mid',
          MessageBody: 'send-mesg-bod',
          MessageDeduplicationId: 'mid1',
          MessageGroupId: 'mid2',
        },
      ],
    });
  });

  test('forward - calls BatchSendMessage - from non-fifo to non-fifo, MessageGroupId and MessageDeduplicationId not included', async () => {
    await sqsService.forward('send', [
      { MessageId: 'mid', Body: 'send-mesg-bod' },
    ]);
    expect(batchSend.execute).toBeCalledTimes(1);
    expect(batchSend.execute).toBeCalledWith({
      QueueUrl: 'https://sqs-queue/send',
      Entries: [
        {
          Id: 'mid',
          MessageBody: 'send-mesg-bod',
        },
      ],
    });
  });

  test('forward - calls BatchSendMessage - from non-fifo to fifo, MessageGroupId and MessageDeduplicationId included', async () => {
    await sqsService.forward('send.fifo', [
      { MessageId: 'mid', Body: 'send-mesg-bod' },
    ]);
    expect(batchSend.execute).toBeCalledTimes(1);
    expect(batchSend.execute).toBeCalledWith({
      QueueUrl: 'https://sqs-queue/send.fifo',
      Entries: [
        {
          Id: 'mid',
          MessageBody: 'send-mesg-bod',
          MessageDeduplicationId: 'mid',
          MessageGroupId: 'mid',
        },
      ],
    });
  });

  test('poll - sends ReceiveMessageCommand', async () => {
    mockSqsSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'mid', Body: 'send-mesg-bod' }],
    });

    const polledMessages = await sqsService.poll('poll', 10, 5);

    expect(mockSqsSend).toBeCalledTimes(1);
    expect(mockSqsSend).toBeCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'https://sqs-queue/poll',
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 5,
        },
      })
    );
    expect(polledMessages).toEqual([
      { MessageId: 'mid', Body: 'send-mesg-bod' },
    ]);
  });

  test('poll - sends ReceiveMessageCommand with visibility', async () => {
    mockSqsSend.mockResolvedValueOnce({
      Messages: [{ MessageId: 'mid', Body: 'send-mesg-bod' }],
    });

    const polledMessages = await sqsService.poll('poll', 10, 5, 0);

    expect(mockSqsSend).toBeCalledTimes(1);
    expect(mockSqsSend).toBeCalledWith(
      expect.objectContaining<Pick<ReceiveMessageCommand, 'input'>>({
        input: {
          QueueUrl: 'https://sqs-queue/poll',
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 5,
          VisibilityTimeout: 0,
        },
      })
    );
    expect(polledMessages).toEqual([
      { MessageId: 'mid', Body: 'send-mesg-bod' },
    ]);
  });

  test('poll - returns empty array if messages are undefined', async () => {
    mockSqsSend.mockReturnValue({ Messages: undefined });

    const polledMessages = await sqsService.poll('poll', 10, 5);

    expect(mockSqsSend).toBeCalledTimes(1);
    expect(mockSqsSend).toBeCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'https://sqs-queue/poll',
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 5,
        },
      })
    );
    expect(polledMessages).toEqual([]);
  });

  test('isAccessible - sends GetQueueAttributesCommaand and returns true if it resolves', async () => {
    mockSqsSend.mockResolvedValueOnce({
      $metadata: {},
      Attributes: { DelaySeconds: '1' },
    } satisfies GetQueueAttributesCommandOutput);

    expect(await sqsService.isAccessible('queue1')).toBe(true);

    expect(mockSqsSend).toBeCalledTimes(1);
    expect(mockSqsSend).toBeCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'https://sqs-queue/queue1',
        },
      })
    );
  });

  test('isAccessible - sends GetQueueAttributesCommaand and returns false if it rejects', async () => {
    mockSqsSend.mockRejectedValueOnce('err');

    expect(await sqsService.isAccessible('queue1')).toBe(false);

    expect(mockSqsSend).toBeCalledTimes(1);
    expect(mockSqsSend).toBeCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'https://sqs-queue/queue1',
        },
      })
    );
  });

  it('queueSize - gets and parses the ApproximateNumberOfMessages attribute from the sqs queue', async () => {
    mockSqsClient.send.mockImplementationOnce(() => ({
      Attributes: {
        ApproximateNumberOfMessages: '23',
      },
    }));

    const result = await sqsService.queueSize('queue1');

    expect(result).toBe(23);

    expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
  });

  it('queueSize - throws error if unable to get ApproximateNumberOfMessages attribute', async () => {
    mockSqsClient.send.mockImplementationOnce(() => ({
      Attributes: {
        SomethingElse: '23',
      },
    }));

    await expect(sqsService.queueSize('queue1')).rejects.toThrow(
      'Could not determine queue size'
    );

    expect(mockSqsClient.send).toHaveBeenCalledTimes(1);
  });
});
