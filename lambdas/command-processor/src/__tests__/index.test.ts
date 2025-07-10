import type { SQSEvent } from 'aws-lambda';
import { createContainer } from 'container';
import { createHandler as createSqsHandler } from 'handler/sqs-handler';
import { handler } from '..';

jest.mock('../container');
jest.mock('../handler/sqs-handler');

const mockContainer = {} as Awaited<ReturnType<typeof createContainer>>;
const mockInnerHandler = jest.fn<Promise<void>, [SQSEvent]>();

const mockCreateContainer = jest.mocked(createContainer);
const mockCreateSqsHandler = jest.mocked(createSqsHandler);

mockCreateContainer.mockResolvedValue(mockContainer);
mockCreateSqsHandler.mockReturnValue(mockInnerHandler);

beforeEach(() => {
  jest.clearAllMocks();
});

const sqsEvent = { Records: [] } as SQSEvent;

it('should load the container, build the SQS handler, and invoke it with the sqsEvent', async () => {
  mockInnerHandler.mockResolvedValue();

  const result = await handler(sqsEvent);

  expect(mockCreateContainer).toHaveBeenCalledTimes(1);
  expect(mockCreateSqsHandler).toHaveBeenCalledWith(mockContainer);
  expect(mockInnerHandler).toHaveBeenCalledWith(sqsEvent);
  expect(result).toBeUndefined();
});

it('should propagate errors from the inner handler', async () => {
  const error = new Error('fail');
  mockInnerHandler.mockRejectedValue(error);

  await expect(handler(sqsEvent)).rejects.toThrow(error);
});
