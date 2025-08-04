import {
  GetQueueAttributesCommand,
  GetQueueAttributesResult,
  ListQueuesCommand,
  ListQueuesResult,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { mock } from 'jest-mock-extended';
import { SqsRepository } from 'sqs-utils';

const mSqsClient = mock<SQSClient>();
const sqsRepository = new SqsRepository(mSqsClient);

const queuePrefix = 'sqs-api-comms-mgr';
const queue = 'SQS_QUEUE';

const listQueueOutput: ListQueuesResult = {
  QueueUrls: ['QUEUE_1', 'QUEUE_2'],
};

const getQueueAttributesOutput: GetQueueAttributesResult = {
  Attributes: {
    ApproximateNumberOfMessagesNotVisible: '10',
  },
};

describe('SqsRepository', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('getAllQueueNamesByPrefix', () => {
    it('calls underlying sqs client with correct payload and returns correct response', async () => {
      mSqsClient.send.mockImplementation(() => listQueueOutput);

      const res = await sqsRepository.getAllQueueNamesByPrefix(queuePrefix);

      expect(mSqsClient.send).toHaveBeenCalledTimes(1);
      expect(mSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            QueueNamePrefix: queuePrefix,
          },
        } satisfies Partial<ListQueuesCommand>),
      );

      expect(res).toEqual(listQueueOutput.QueueUrls);
    });

    it('throws if underlying sqs client throws', async () => {
      mSqsClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        sqsRepository.getAllQueueNamesByPrefix(queuePrefix),
      ).rejects.toThrow();

      expect(mSqsClient.send).toHaveBeenCalledTimes(1);
    });

    it('returns empty list if response does not contain QueueUrls', async () => {
      mSqsClient.send.mockImplementation(() => [{} satisfies ListQueuesResult]);

      const res = await sqsRepository.getAllQueueNamesByPrefix(queuePrefix);

      expect(res).toEqual([]);
    });
  });

  describe('getNumberOfMessagesNotVisible', () => {
    it('calls underlying sqs client with correct payload and returns correct response', async () => {
      mSqsClient.send.mockImplementation(() => getQueueAttributesOutput);

      const res = await sqsRepository.getNumberOfMessagesNotVisible(queue);

      expect(mSqsClient.send).toHaveBeenCalledTimes(1);
      expect(mSqsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            QueueUrl: queue,
            AttributeNames: ['ApproximateNumberOfMessagesNotVisible'],
          },
        } satisfies Partial<GetQueueAttributesCommand>),
      );

      expect(res).toEqual(
        getQueueAttributesOutput.Attributes
          ?.ApproximateNumberOfMessagesNotVisible,
      );
    });

    it('throws if underlying sqs client throws', async () => {
      mSqsClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        sqsRepository.getNumberOfMessagesNotVisible(queue),
      ).rejects.toThrow();

      expect(mSqsClient.send).toHaveBeenCalledTimes(1);
    });
  });

  test('send', async () => {
    await sqsRepository.send('queue-url', {});

    expect(mSqsClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'queue-url',
          MessageBody: '{}',
        },
      }),
    );
  });
});
