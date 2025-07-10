import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { SQSEvent } from 'aws-lambda';
import { mock } from 'jest-mock-extended';
import { mockNudgeCommand, mockRequest, sqsRecord } from '__tests__/constants';
import type { CommandProcessorService } from 'app/command-processor-service';
import { parseSqsRecord } from 'app/parse-nudge-command';
import { createHandler } from 'handler/sqs-handler';
import { mapQueueToRequest } from 'domain/mapper';

jest.mock('domain/mapper');
jest.mock('app/parse-nudge-command');
jest.mock('nhs-notify-sms-nudge-utils/logger');

const mockedParse = parseSqsRecord as jest.Mock;
const mockedMapper = mapQueueToRequest as jest.Mock;
const mockService = mock<CommandProcessorService>();
mockService.process.mockResolvedValue();

const mockLogger = jest.mocked(logger);

const handler = createHandler({
  commandProcessorService: mockService,
  logger: mockLogger,
});

describe('SQS Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes a single record', async () => {
    const sqsEvent: SQSEvent = {
      Records: [{ ...sqsRecord, body: JSON.stringify(mockNudgeCommand) }],
    };

    mockedMapper.mockReturnValueOnce(mockRequest);
    mockedParse.mockReturnValueOnce(mockNudgeCommand);
    mockService.process.mockResolvedValueOnce();

    await handler(sqsEvent);

    expect(mockedParse).toHaveBeenCalledWith(sqsEvent.Records[0], mockLogger);
    expect(mockedMapper).toHaveBeenCalledWith(mockNudgeCommand);
    expect(mockService.process).toHaveBeenCalledWith(mockRequest);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received SQS Event of %s record(s)',
      1,
    );
  });

  it('processes two records', async () => {
    const sqsRecord1 = {
      ...sqsRecord,
      messageId: '2',
    };

    const incoming1 = mockNudgeCommand;
    const incoming2 = {
      ...mockNudgeCommand,
      nhsNumber: '9999999788',
    };

    const request1 = mockRequest;
    const request2 = {
      ...mockRequest,
      recipient: {
        nhsNumber: '9999999788',
      },
    };

    const sqsEvent: SQSEvent = {
      Records: [
        { ...sqsRecord, body: JSON.stringify(incoming1) },
        { ...sqsRecord1, body: JSON.stringify(incoming2) },
      ],
    };

    mockedMapper.mockReturnValueOnce(request1).mockReturnValueOnce(request2);
    mockedParse.mockReturnValueOnce(incoming1).mockReturnValueOnce(incoming2);

    mockService.process.mockResolvedValueOnce();
    mockService.process.mockResolvedValueOnce();

    await handler(sqsEvent);

    expect(mockedParse).toHaveBeenCalledWith(sqsEvent.Records[0], mockLogger);
    expect(mockedParse).toHaveBeenCalledWith(sqsEvent.Records[1], mockLogger);

    expect(mockedMapper).toHaveBeenCalledWith(incoming1);
    expect(mockedMapper).toHaveBeenCalledWith(incoming2);

    expect(mockService.process).toHaveBeenCalledWith(request1);
    expect(mockService.process).toHaveBeenCalledWith(request2);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Received SQS Event of %s record(s)',
      2,
    );
  });

  it('should throw an error if parseSqsRecord throws', async () => {
    mockedParse.mockImplementationOnce(() => {
      throw new Error('Test Error');
    });

    const sqsEvent = {
      Records: [{ messageId: 'msg-1', body: '{}' }],
    } as unknown as SQSEvent;

    await expect(handler(sqsEvent)).rejects.toThrow('Test Error');

    expect(mockedParse).toHaveBeenCalledWith(sqsEvent.Records[0], logger);
  });
});
