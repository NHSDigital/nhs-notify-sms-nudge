// src/handler/sqs-handler.spec.ts
import { createHandler } from '../../handler/sqs-handler';
import { mapQueueToRequest } from '../../domain/mapper';
import type { SQSEvent } from 'aws-lambda';
import type { Request } from '../../domain/request';
import { expectedRequest, expectedNudgeCommand } from '../test-data/data-event';
import type { CommandProcessorService } from '../../app/command-processor-service';

jest.mock('../../domain/mapper');
const mockedMapper = mapQueueToRequest as jest.MockedFunction<
  typeof mapQueueToRequest
>;

// Create a Partial mock and then cast it to the full mocked type
const partialServiceMock: Partial<jest.Mocked<CommandProcessorService>> = {
  process: jest.fn<Promise<void>, [Request]>(),
};
const commandProcessorService = partialServiceMock as jest.Mocked<CommandProcessorService>;

const handler = createHandler({ commandProcessorService });

describe('SQS Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes two records with slight variation', async () => {
    const incoming1 = expectedNudgeCommand;
    const incoming2 = {
      ...expectedNudgeCommand,
      nhsNumber: '9999999788'
    };

    const request1 = expectedRequest;
    const request2 = {
      ...expectedRequest,
      recipient: {
        nhsNumber: '9999999788'
      }
    };

    (mapQueueToRequest as jest.Mock)
      .mockReturnValueOnce(request1)
      .mockReturnValueOnce(request2);

    const event = {
      Records: [
        { body: JSON.stringify(incoming1) },
        { body: JSON.stringify(incoming2) },
      ],
    } as unknown as SQSEvent;

    commandProcessorService.process.mockResolvedValueOnce();
    commandProcessorService.process.mockResolvedValueOnce();

    await expect(handler(event)).resolves.toBeUndefined();

    expect(mockedMapper).toHaveBeenCalledWith(incoming1);
    expect(mockedMapper).toHaveBeenCalledWith(incoming2);

    expect(commandProcessorService.process).toHaveBeenCalledWith(request1);
    expect(commandProcessorService.process).toHaveBeenCalledWith(request2);
  });
});
