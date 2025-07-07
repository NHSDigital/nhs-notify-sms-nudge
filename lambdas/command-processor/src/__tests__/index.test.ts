import { handler } from '../index';

describe('handler', () => {
  const OLD_LOG = console.log;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('logs each SQS message body', async () => {
    const event = {
      Records: [
        { body: 'message-1' },
        { body: 'message-2' }
      ]
    } as any;

    await handler(event, {} as any, jest.fn());

    expect(logSpy).toHaveBeenCalledWith('Received SQS message:', 'message-1');
    expect(logSpy).toHaveBeenCalledWith('Received SQS message:', 'message-2');
    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});
