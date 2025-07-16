import { logger } from 'nhs-notify-sms-nudge-utils';
import { handler } from '..';

jest.mock('nhs-notify-sms-nudge-utils/logger');
const mockLogger = jest.mocked(logger);

describe('handler', () => {
  it('logs on handler', async () => {
    const event = {
      Records: [
        { messageId: 'message-1-id', body: 'message-1' },
        { messageId: 'message-2-id', body: 'message-2' },
      ],
    } as any;

    await handler(event, {} as any, jest.fn());

    // this is a stub implementation, ensure an execution log is created only
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
