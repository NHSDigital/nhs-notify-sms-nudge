import { logger } from 'nhs-notify-sms-nudge-utils';
import { mock } from 'jest-mock-extended';
import {
  mockNudgeCommand1,
  mockNudgeCommand2,
  mockRequest1,
  mockRequest2,
  mockRoutingPlanId,
  multiRecordEvent,
  singleRecordEvent,
} from '__tests__/constants';
import type { CommandProcessorService } from 'app/command-processor-service';
import { parseSqsRecord } from 'app/parse-nudge-command';
import { createHandler } from 'handler/sqs-handler';
import { mapQueueToRequest } from 'domain/mapper';

jest.mock('domain/mapper');
jest.mock('app/parse-nudge-command');
jest.mock('nhs-notify-sms-nudge-utils');

const mockedParse = parseSqsRecord as jest.Mock;
const mockedMapper = mapQueueToRequest as jest.Mock;
const mockService = mock<CommandProcessorService>();
mockService.process.mockResolvedValue();

const mockLogger = jest.mocked(logger);

const handler = createHandler({
  commandProcessorService: mockService,
  routingPlanId: mockRoutingPlanId,
  logger: mockLogger,
});

describe('SQS Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes a single record', async () => {
    mockedMapper.mockReturnValueOnce(mockRequest1);
    mockedParse.mockReturnValueOnce(mockNudgeCommand1);

    const response = await handler(singleRecordEvent);

    expect(mockedParse).toHaveBeenCalledWith(
      singleRecordEvent.Records[0],
      mockLogger,
    );
    expect(mockedMapper).toHaveBeenCalledWith(
      mockNudgeCommand1,
      mockRoutingPlanId,
    );
    expect(mockService.process).toHaveBeenCalledWith(mockRequest1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received SQS Event of 1 record(s)',
    );
    expect(response).toEqual({ batchItemFailures: [] });
  });

  it('processes two records', async () => {
    mockedMapper
      .mockReturnValueOnce(mockRequest1)
      .mockReturnValueOnce(mockRequest2);
    mockedParse
      .mockReturnValueOnce(mockNudgeCommand1)
      .mockReturnValueOnce(mockNudgeCommand2);

    const response = await handler(multiRecordEvent);

    expect(mockedParse).toHaveBeenCalledWith(
      multiRecordEvent.Records[0],
      mockLogger,
    );
    expect(mockedParse).toHaveBeenCalledWith(
      multiRecordEvent.Records[1],
      mockLogger,
    );

    expect(mockedMapper).toHaveBeenCalledWith(
      mockNudgeCommand1,
      mockRoutingPlanId,
    );
    expect(mockedMapper).toHaveBeenCalledWith(
      mockNudgeCommand2,
      mockRoutingPlanId,
    );

    expect(mockService.process).toHaveBeenCalledWith(mockRequest1);
    expect(mockService.process).toHaveBeenCalledWith(mockRequest2);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received SQS Event of 2 record(s)',
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      '2 of 2 records processed successfully',
    );

    expect(response).toEqual({ batchItemFailures: [] });
  });

  it('should return failed items to the queue if an error occurs while processing them', async () => {
    mockedParse.mockImplementation((record) => {
      if (record.messageId === '1') throw new Error('Test Error');
      return mockNudgeCommand2;
    });

    const result = await handler(multiRecordEvent);

    expect(mockLogger.warn).toHaveBeenCalledWith({
      error: 'Test Error',
      description: 'Failed processing message',
      messageId: '1',
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      '1 of 2 records processed successfully',
    );

    expect(result).toEqual({
      batchItemFailures: [{ itemIdentifier: '1' }],
    });
  });
});
