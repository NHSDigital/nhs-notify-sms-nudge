import { logger } from 'nhs-notify-sms-nudge-utils';
import { CommandProcessorService } from 'app/command-processor-service';
import { mockRequest, mockResponse } from '__tests__/constants';
import { NotifyClient } from 'app/notify-api-client';

jest.mock('nhs-notify-sms-nudge-utils');

const mockClient = {
  sendRequest: jest.fn(),
} as unknown as jest.Mocked<NotifyClient>;

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
    mockClient.sendRequest.mockResolvedValueOnce(mockResponse);

    await expect(
      commandProcessorService.process(mockRequest),
    ).resolves.toBeUndefined();

    expect(mockClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient.sendRequest).toHaveBeenCalledWith(
      mockRequest,
      mockRequest.data.attributes.messageReference,
    );

    expect(mockLogger.info).toHaveBeenCalledWith('Processing request', {
      messageReference: 'request-item-id_request-item-plan-id',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully processed request',
      {
        messageReference: 'request-item-id_request-item-plan-id',
        messageItemId: '30XcAOfwjq59r72AQTjxL4V7Heg',
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
