import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import { mockNudgeCommand, mockRequest } from '__tests__/constants';
import { mapQueueToRequest } from 'domain/mapper';
import type { NudgeCommand } from 'domain/nudge-command';

jest.mock('nhs-notify-sms-nudge-utils/logger');

const mockLogger = jest.mocked(logger);

describe('mapQueueToRequest', () => {
  it('correctly maps mockNudgeCommand → mockRequest', () => {
    const result = mapQueueToRequest(mockNudgeCommand);

    expect(result).toEqual(mockRequest);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Mapping sqsEvent % to request',
      mockRequest.messageReference,
    );
  });
  it('correctly maps mockNudgeCommand to mockRequest when campaignId is not provided', () => {
    const NudgeCommand = {
      ...mockNudgeCommand,
      campaignId: '',
    };

    const request = {
      ...mockRequest,
      billingReference: 'test_client_id-test_billing_reference',
    };

    const result = mapQueueToRequest(NudgeCommand);

    expect(result).toEqual(request);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Mapping sqsEvent % to request',
      request.messageReference,
    );
  });
  it('correctly maps mockNudgeCommand to mockRequest when billingReference is not provided', () => {
    const NudgeCommand = {
      ...mockNudgeCommand,
      billingReference: '',
    };

    const request = {
      ...mockRequest,
      billingReference: 'test_client_id-test_campaign_id',
    };

    const result = mapQueueToRequest(NudgeCommand);

    expect(result).toEqual(request);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Mapping sqsEvent % to request',
      request.messageReference,
    );
  });
  it('correctly maps mockNudgeCommand to mockRequest when billingReference and campaignId are not provided', () => {
    const NudgeCommand = {
      ...mockNudgeCommand,
      billingReference: '',
      campaignId: '',
    };

    const request = {
      ...mockRequest,
      billingReference: 'test_client_id',
    };

    const result = mapQueueToRequest(NudgeCommand);

    expect(result).toEqual(request);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Mapping sqsEvent % to request',
      request.messageReference,
    );
  });
  it('throws when required fields are missing', () => {
    const invalidMessage = {} as NudgeCommand;
    expect(() => mapQueueToRequest(invalidMessage)).toThrow();
  });
});
