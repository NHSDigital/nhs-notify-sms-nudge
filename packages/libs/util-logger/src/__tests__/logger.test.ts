/* eslint-disable unicorn/prefer-json-parse-buffer */
import { readFile, rm } from 'node:fs/promises';
import { createLogger } from '../logger';
import { commonLoggerTests } from './test-config/common-logger-tests';

describe('logger', () => {
  const LOG_PATH = './logging.txt';

  const unlinkLog = () => rm(LOG_PATH, { force: true });

  beforeEach(unlinkLog);
  afterAll(unlinkLog);

  function readRawLogFile(): Promise<string> {
    return readFile(LOG_PATH, 'utf8');
  }

  async function parseLogFile(): Promise<Record<string, unknown>> {
    const data: unknown = JSON.parse(await readRawLogFile());
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    throw new TypeError(
      `could not load an object from ${await readRawLogFile()}`
    );
  }

  let SAVED_ENV: NodeJS.ProcessEnv;

  beforeEach(() => {
    SAVED_ENV = { ...process.env };
  });

  afterEach(() => {
    process.env = SAVED_ENV;
  });

  it('records certain environment variables', async () => {
    process.env.ENVIRONMENT = 'internal-dev';
    process.env.COMPONENT = 'lambda';
    process.env.CODE_VERSION = '47';

    const logger = createLogger(LOG_PATH);

    logger.info('test-description');

    const data = await parseLogFile();

    expect(data.componentName).toEqual('lambda');
    expect(data.componentVersion).toEqual('47');
    expect(data.environment).toEqual('internal-dev');
  });

  it('records time', async () => {
    const logger = createLogger(LOG_PATH);

    const timeBefore = Date.now();
    logger.info('test-description');
    const timeAfter = Date.now();

    const data = await parseLogFile();

    expect(data.time).toBeGreaterThanOrEqual(timeBefore);
    expect(data.time).toBeLessThanOrEqual(timeAfter);
  });

  it('does not log debug by default', async () => {
    const logger = createLogger(LOG_PATH);

    logger.debug('test-description');

    const data = await readRawLogFile();

    expect(data).toEqual('');
  });

  it('logs debug if set in environment variables', async () => {
    process.env.LOG_LEVEL = 'debug';

    const logger = createLogger(LOG_PATH);

    logger.debug('test-description');

    const data = await parseLogFile();

    expect(data.description).toMatch(/test-description/);
  });

  commonLoggerTests('prod', () => createLogger(LOG_PATH), readRawLogFile);

  it('does not log an error under the `error` path', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      error: new Error('error-message'),
      err: 'An Error Message',
    });

    const data = await parseLogFile();
    expect(data.error).toEqual({});
  });

  it('does not use the description from an Error object under the error key', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      error: new Error('error-message'),
      err: 'An Error Message',
    });

    const data = await parseLogFile();
    expect(data.description).toBe(undefined);
  });

  it('does not cause serialisation issues when passing string to err key', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({ err: 'hello' });

    const data = await parseLogFile();
    expect(data.err).toBe('hello');
  });

  it('will set description key to the message key of an err object if provided.', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      err: {
        message: 'An Error',
        hello: 'hello',
      },
    });

    const data = await parseLogFile();
    expect(data.description).toEqual('An Error');
    expect((data.err as any).message).toBe('An Error');
    expect((data.err as any).hello).toBe('hello');
  });

  it('will not override description key if set when an Error object if provided to err key.', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      description: 'Hello',
      err: new Error('An Error'),
    });

    const data = await parseLogFile();
    expect(data.description).toEqual('Hello');
    expect((data.err as any).message).toBe('An Error');
  });

  it('will set description key to the message parameter of an Error object if provided to err key.', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      err: new Error('An Error'),
    });

    const data = await parseLogFile();
    expect(data.description).toEqual('An Error');
    expect((data.err as any).message).toBe('An Error');
  });

  it('uses the description parameter in favour of an Error under the error key or a description field', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error(
      {
        error: new Error('error-message'),
        description: 'field-message',
        err: 'hello',
      },
      'parameter-message'
    );

    const data = await parseLogFile();
    expect(data.description).toBe('parameter-message');
  });

  it('uses the description field in favour of an Error under the error key', async () => {
    const logger = createLogger(LOG_PATH);

    logger.error({
      error: new Error('error-message'),
      description: 'field-message',
      err: 'hello',
    });

    const data = await parseLogFile();
    expect(data.description).toBe('field-message');
  });
});
