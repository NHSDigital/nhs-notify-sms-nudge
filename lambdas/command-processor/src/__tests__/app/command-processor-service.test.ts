import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import { CommandProcessorService } from 'app/command-processor-service';
import type { ApiClient } from 'api-client';
import { mockRequest } from '__tests__/constants';

jest.mock('nhs-notify-sms-nudge-utils/logger');

const mockClient = {
  sendRequest: jest.fn(),
} as unknown as jest.Mocked<ApiClient>;

const mockLogger = jest.mocked(logger);

const commandProcessorService = new CommandProcessorService({
  nhsNotifyClient: mockClient,
  logger: mockLogger,
});

describe('CommandProcessorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('completes when the API client succeeds', async () => {
    mockClient.sendRequest.mockResolvedValue({ status: 'ok' });

    await expect(
      commandProcessorService.process(mockRequest),
    ).resolves.toBeUndefined();

    expect(mockClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient.sendRequest).toHaveBeenCalledWith(mockRequest);

    expect(mockLogger.info).toHaveBeenCalledWith('Processing request', {
      messageReference: 'request-item-id_request-item-plan-id',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully processed request',
      {
        messageReference: 'request-item-id_request-item-plan-id',
      },
    );
  });
  it('re-throws when the API client fails', async () => {
    const err = new Error('API failure');
    mockClient.sendRequest.mockRejectedValue(err);

    await expect(commandProcessorService.process(mockRequest)).rejects.toThrow(
      err,
    );

    expect(mockLogger.error).toHaveBeenCalledWith('Failed processing request', {
      messageReference: 'request-item-id_request-item-plan-id',
      error: 'API failure',
    });
  });
});
