import { createMockLogger, MockLogger } from '../mock-logger';
import { commonLoggerTests } from './test-config/common-logger-tests';

describe('mock logger', () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  commonLoggerTests(
    'mock',
    () => mockLogger.logger,
    () => Promise.resolve(mockLogger.rawMessages.join('\n'))
  );

  it('captures log messages', () => {
    mockLogger.logger.info({ message: 'test message' });
    expect(mockLogger.messages).toMatchInlineSnapshot(`
      [
        {
          "level": "info",
          "message": "test message",
        },
      ]
    `);
    expect(mockLogger.prettyMessages()).toMatchInlineSnapshot(`
      [
        "INFO: {"message":"test message"}
      ",
      ]
    `);
  });

  it('throws an an Error if you try and log an Error under an incorrect key', () => {
    const badErrorKeys = [
      'error',
      'myErr',
      'baseError',
      'exception',
      'thisExceptionGotThrown',
      'ex',
    ];
    const { logger, messages } = mockLogger;
    for (const badErrorKey of badErrorKeys) {
      expect(() =>
        logger.error({
          err: 'An Error Message',
          [badErrorKey]: new Error('some error'),
        })
      ).toThrow(/^Errors must be logged under the err key/);
    }
    expect(messages).toHaveLength(0);
  });

  it('reset clears message buffers', () => {
    mockLogger.logger.info({ message: 'test message' });
    mockLogger.reset();
    expect(mockLogger.messages).toEqual([]);
    expect(mockLogger.rawMessages).toEqual([]);
  });
});
