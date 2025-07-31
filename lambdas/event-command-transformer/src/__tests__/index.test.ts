import { handler } from '../index';
import { SQSClient } from '@aws-sdk/client-sqs';

const sendMock = jest.fn();
SQSClient.prototype.send = sendMock;

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    COMMANDS_QUEUE_URL: 'https://mock-commands-queue',
    EVENTS_DLQ_URL: 'https://mock-events-dlq',
  };
  sendMock.mockReset();
});

afterAll(() => {
  process.env = originalEnv;
});

test('forwards message to commands queue', async () => {
  sendMock.mockResolvedValueOnce({});

  await handler({
    Records: [{ body: 'test-message' }],
  } as any, {} as any, jest.fn());

  expect(sendMock).toHaveBeenCalledTimes(1);
  expect(sendMock).toHaveBeenCalledWith(
    expect.objectContaining({
      input: {
        QueueUrl: 'https://mock-commands-queue',
        MessageBody: 'test-message',
      },
    })
  );
});

test('sends to DLQ on failure', async () => {
  sendMock
    .mockRejectedValueOnce(new Error('Failure'))
    .mockResolvedValueOnce({});

  await handler({
    Records: [{ body: 'fail-message' }],
  } as any, {} as any, jest.fn());

  expect(sendMock).toHaveBeenCalledTimes(2);
  expect(sendMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      input: {
        QueueUrl: 'https://mock-events-dlq',
        MessageBody: 'fail-message',
      },
    })
  );
});
