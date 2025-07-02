import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { randomUUID } from 'crypto';
import { sendSQSMessage } from '../sendSQSMessageBatch';

jest.mock('crypto');
(randomUUID as jest.Mock)
  .mockReturnValueOnce('uuid1')
  .mockReturnValueOnce('uuid2')
  .mockReturnValueOnce('uuid3');

const sqsClient = mockClient(SQSClient);

it('sends SQS message', async () => {
  await sendSQSMessage('queue-url', [
    {
      value1: '1a',
      value2: '2a',
    },
    {
      value1: '1b',
      value2: '2b',
    },
  ]);

  expect(sqsClient).toHaveReceivedCommandWith(SendMessageBatchCommand, {
    QueueUrl: 'queue-url',
    Entries: [
      {
        Id: 'uuid1',
        MessageBody: JSON.stringify({
          value1: '1a',
          value2: '2a',
        }),
        MessageGroupId: 'default-message-group',
      },
      {
        Id: 'uuid2',
        MessageBody: JSON.stringify({
          value1: '1b',
          value2: '2b',
        }),
        MessageGroupId: 'default-message-group',
      },
    ],
  });
});

it('does not send MessageGroupId if the last argument is null', async () => {
  await sendSQSMessage(
    'queue-url',
    [
      {
        value1: '1a',
      },
    ],
    null
  );

  expect(sqsClient).toHaveReceivedCommandWith(SendMessageBatchCommand, {
    QueueUrl: 'queue-url',
    Entries: [
      {
        Id: 'uuid3',
        MessageBody: JSON.stringify({
          value1: '1a',
        }),
      },
    ],
  });
});
