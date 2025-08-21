import { mock } from 'jest-mock-extended';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { CommandProcessorService } from 'app/command-processor-service';
import { mockRequest, mockResponse } from '__tests__/constants';
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

    expect(await commandProcessorService.process(mockRequest)).toBeUndefined();

    expect(mockClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient.sendRequest).toHaveBeenCalledWith(
      mockRequest,
      mockRequest.data.attributes.messageReference,
    );

    expect(mockLogger.info).toHaveBeenCalledWith('Processing request', {
      messageReference: mockRequest.data.attributes.messageReference,
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Successfully processed request',
      {
        messageReference: mockRequest.data.attributes.messageReference,
        messageItemId: mockResponse.data.id,
      },
    );
  });

  it('re-throws when the API client fails', async () => {
    const errorMessage = 'API failure';
    const err = new Error(errorMessage);
    mockClient.sendRequest.mockRejectedValue(err);

    await expect(commandProcessorService.process(mockRequest)).rejects.toThrow(
      err,
    );

    expect(mockLogger.error).toHaveBeenCalledWith('Failed processing request', {
      messageReference: mockRequest.data.attributes.messageReference,
      error: errorMessage,
    });
  });

  it('does not re-throw when a RequestAlreadyReceivedError is thrown by the API client', async () => {
    const err = new RequestAlreadyReceivedError(
      'The request has already been received by the Notify API',
    );
    mockClient.sendRequest.mockRejectedValue(err);

    expect(await commandProcessorService.process(mockRequest)).toBeUndefined();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Request has already been received by Notify',
      {
        messageReference: mockRequest.data.attributes.messageReference,
        err,
      },
    );
  });
});
