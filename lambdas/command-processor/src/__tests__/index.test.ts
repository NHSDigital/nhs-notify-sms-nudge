// import { handler } from '../index';

// describe('handler', () => {
//   const OLD_LOG = console.log;
//   let logSpy: jest.SpyInstance;

//   beforeEach(() => {
//     logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
//   });

//   afterEach(() => {
//     logSpy.mockRestore();
//   });

//   it('logs each SQS message body', async () => {
//     const event = {
//       Records: [
//         { body: 'message-1' },
//         { body: 'message-2' }
//       ]
//     } as any;

//     await handler(event, {} as any, jest.fn());

//     expect(logSpy).toHaveBeenCalledWith('Received SQS message:', 'message-1');
//     expect(logSpy).toHaveBeenCalledWith('Received SQS message:', 'message-2');
//     expect(logSpy).toHaveBeenCalledTimes(2);
//   });
// });

import { handler } from '../index';
import { createContainer } from '../container';
import { createHandler as createSqsHandler } from '../handler/sqs-handler';
import type { SQSEvent } from 'aws-lambda';

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

it('should load the container, build the SQS handler, and invoke it with the event', async () => {
  mockInnerHandler.mockResolvedValue(undefined);

  const event = { Records: [] } as SQSEvent;
  const result = await handler(event);

  expect(mockCreateContainer).toHaveBeenCalledTimes(1);
  expect(mockCreateSqsHandler).toHaveBeenCalledWith(mockContainer);
  expect(mockInnerHandler).toHaveBeenCalledWith(event);
  expect(result).toBeUndefined();
});

it('should propagate errors from the inner handler', async () => {
  const error = new Error('fail');
  mockInnerHandler.mockRejectedValue(error);

  const event = { Records: [] } as SQSEvent;
  await expect(handler(event)).rejects.toThrow(error);
});
