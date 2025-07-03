import { handler } from '../index';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

jest.mock('@aws-sdk/client-sqs');

const mockSend = jest.fn();
(SQSClient as jest.Mock).mockImplementation(() => ({ send: mockSend }));

describe('handler', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    mockSend.mockReset();
    jest.resetModules();
    process.env = { ...OLD_ENV, COMMANDS_QUEUE_URL: 'commands-queue-url', EVENTS_DLQ_URL: 'events-dlq-url' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('forwards message to commands queue', async () => {
    const event = {
      Records: [
        { body: 'test-message' }
      ]
    } as any;

    await handler(event, {} as any, jest.fn());

    expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
    const call = mockSend.mock.calls[0][0] as SendMessageCommand;
    expect(call.input.QueueUrl).toBe('commands-queue-url');
    expect(call.input.MessageBody).toBe('test-message');
  });

  it('sends to DLQ on error', async () => {
    mockSend.mockImplementationOnce(() => { throw new Error('fail'); });
    const event = {
      Records: [
        { body: 'fail-message' }
      ]
    } as any;

    await handler(event, {} as any, jest.fn());

    expect(mockSend).toHaveBeenCalledTimes(2);
    const dlqCall = mockSend.mock.calls[1][0] as SendMessageCommand;
    expect(dlqCall.input.QueueUrl).toBe('events-dlq-url');
    expect(dlqCall.input.MessageBody).toBe('fail-message');
  });
});
