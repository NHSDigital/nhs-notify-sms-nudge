import { mock } from 'jest-mock-extended';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { CommandProcessorService } from 'app/command-processor-service';
import { mockRequest1, mockResponse } from '__tests__/constants';
import { NotifyClient } from 'app/notify-api-client';
import { RequestAlreadyReceivedError } from 'domain/request-already-received-error';

jest.mock('nhs-notify-sms-nudge-utils');

const mockClient = mock<NotifyClient>();

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

    expect(await commandProcessorService.process(mockRequest1)).toBeUndefined();

    expect(mockClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient.sendRequest).toHaveBeenCalledWith(
      mockRequest1,
      mockRequest1.data.attributes.messageReference,
    );

    expect(mockLogger.info).toHaveBeenCalledWith('Processing request', {
      messageReference: mockRequest1.data.attributes.messageReference,
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully processed request',
      {
        messageReference: mockRequest1.data.attributes.messageReference,
        messageItemId: mockResponse.data.id,
      },
    );
  });

  it('re-throws when the API client fails', async () => {
    const errorMessage = 'API failure';
    const err = new Error(errorMessage);
    mockClient.sendRequest.mockRejectedValue(err);

    await expect(commandProcessorService.process(mockRequest1)).rejects.toThrow(
      err,
    );

    expect(mockLogger.error).toHaveBeenCalledWith('Failed processing request', {
      messageReference: mockRequest1.data.attributes.messageReference,
      error: errorMessage,
    });
  });

  it('does not re-throw when a RequestAlreadyReceivedError is thrown by the API client', async () => {
    const { messageReference } = mockRequest1.data.attributes;
    const err = new RequestAlreadyReceivedError(
      new Error('Request was already received!'),
      messageReference,
    );
    mockClient.sendRequest.mockRejectedValue(err);

    expect(await commandProcessorService.process(mockRequest1)).toBeUndefined();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Request has already been received by Notify',
      {
        messageReference,
      },
    );
  });
});
