import { ContextLogger } from '../../logger';
import { SensitiveError } from './sensitive-error';

/**
 * Common tests for mock and prod logger
 */
// eslint-disable-next-line jest/no-export
export function commonLoggerTests(
  loggerType: string,
  getLogger: () => ContextLogger,
  readRawLogFile: () => Promise<string>
) {
  describe(`common logger tests - ${loggerType} logger`, () => {
    let logger: ContextLogger;

    beforeEach(() => {
      logger = getLogger();
    });

    async function parseLogFile(): Promise<Record<string, unknown>> {
      const rawLogData = await readRawLogFile();

      const data: unknown = JSON.parse(rawLogData);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as Record<string, unknown>;
      }
      throw new TypeError(`could not load an object from ${rawLogData}`);
    }

    it('records correct data for an info message', async () => {
      logger.info('test-description');

      const data = await parseLogFile();

      expect(data.level).toBe('info');
      expect(data.description).toBe('test-description');
    });

    it('records correct data for an error message', async () => {
      logger.error('test-description');

      const data = await parseLogFile();
      expect(data.level).toBe('error');
      expect(data.description).toBe('test-description');
    });

    it('logs an error under the `err` path', async () => {
      const error = new Error('error-message');

      logger.error({ err: error });

      const data = await parseLogFile();
      expect(data.err).toEqual({
        message: 'error-message',
        type: 'Error',
        stack: error.stack,
      });
    });

    it('uses the description from an Error if one is provided under the err key', async () => {
      logger.error({ err: new Error('error-message') });

      const data = await parseLogFile();
      expect(data.description).toBe('error-message');
    });

    it('uses the description from a non-Error object under the err key', async () => {
      logger.error({ err: { message: 'error-message' } });

      const data = await parseLogFile();
      expect(data.description).toBe('error-message');
    });

    it('does not use the description from a non-Error as the sole object', async () => {
      logger.error({ message: 'error-message', err: 'An Error Message' });

      const data = await parseLogFile();
      expect(data.description).toBe(undefined);
    });

    it('uses the description parameter in favour of an Error under the err key or a description field', async () => {
      logger.error(
        { err: new Error('error-message'), description: 'field-message' },
        'parameter-message'
      );

      const data = await parseLogFile();
      expect(data.description).toBe('parameter-message');
    });

    it('uses the description field in favour of an Error under the err key', async () => {
      logger.error({
        err: new Error('error-message'),
        description: 'field-message',
      });

      const data = await parseLogFile();
      expect(data.description).toBe('field-message');
    });

    it('logs the description only once when using description field and parameter', async () => {
      logger.error(
        {
          description: 'error-message',
          err: 'An Error Message',
        },
        'parameter-message'
      );

      expect(await readRawLogFile()).not.toMatch(/description.*description/);
    });

    it('logs the description only once when using Error and parameter', async () => {
      logger.error({ err: new Error('error-message') }, 'parameter-message');

      expect(await readRawLogFile()).not.toMatch(/description.*description/);
    });

    it('logs the description only once when using Error and description field', async () => {
      logger.error({
        err: new Error('error-message'),
        description: 'field-message',
      });

      expect(await readRawLogFile()).not.toMatch(/description.*description/);
    });

    it('Logs null correctly', async () => {
      logger.info(null, 'test-description');

      const data = await parseLogFile();
      expect(data.level).toBe('info');
      expect(data.description).toBe('test-description');
    });

    it('redacts sensitive keys on errors logged under the "err" key', async () => {
      const err = new SensitiveError('oh no');

      logger.error({ err });

      const data = await parseLogFile();
      expect(data.err).toEqual({
        type: 'SensitiveError',
        message: err.message,
        stack: err.stack,
        nonRedactedProperty: err.nonRedactedProperty,
        config: '[Redacted]',
        request: '[Redacted]',
        response: '[Redacted]',
        CancellationReasons: [{ Item: '[Redacted]' }],
      });
    });

    it('redacts sensitive keys on objects logged under the "error" key', async () => {
      const error = new SensitiveError('oh no').json();

      logger.error({ err: {}, error });

      const data = await parseLogFile();

      expect(data.error).toEqual({
        nonRedactedProperty: error.nonRedactedProperty,
        config: '[Redacted]',
        request: '[Redacted]',
        response: '[Redacted]',
        CancellationReasons: [{ Item: '[Redacted]' }],
      });
    });

    it('redacts sensitive keys on objects logged under the "e" key', async () => {
      const e = new SensitiveError('oh no').json();

      logger.error({ err: {}, e });

      const data = await parseLogFile();

      expect(data.e).toEqual({
        nonRedactedProperty: e.nonRedactedProperty,
        config: '[Redacted]',
        request: '[Redacted]',
        response: '[Redacted]',
        CancellationReasons: [{ Item: '[Redacted]' }],
      });
    });
  });
}
