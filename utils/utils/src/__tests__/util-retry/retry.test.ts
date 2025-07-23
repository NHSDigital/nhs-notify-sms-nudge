import { backoff } from 'util-retry/backoff';
import { sleepMs } from 'util-retry/sleep';
import { conditionalRetry, retry, retryUntil } from 'util-retry/retry';

jest.mock('util-retry/backoff');
jest.mock('util-retry/sleep');

const backoffMock = jest.mocked(backoff);
const sleepMock = jest.mocked(sleepMs);

const BACKOFF_MS = 1000;
const err = new Error('oops');

beforeEach(() => {
  jest.clearAllMocks();
  backoffMock.mockReturnValue(BACKOFF_MS);
});

describe('retry', () => {
  it('returns immediately when the action resolves', async () => {
    const fn = jest.fn().mockResolvedValueOnce('hello');

    await expect(retry(fn)).resolves.toBe('hello');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('retries on errors with correct backoff until the action resolves', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce('hello');

    await expect(retry(fn)).resolves.toBe('hello');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);
    expect(backoffMock).toHaveBeenCalledWith(1, {});
  });

  it('makes up to 10 attempts by default before rejecting', async () => {
    const fn = jest.fn().mockRejectedValue(err);

    await expect(retry(fn)).rejects.toBe(err);

    expect(fn).toHaveBeenCalledTimes(10);
    expect(sleepMock).toHaveBeenCalledTimes(9);
  });

  it('has configurable max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(err);

    await expect(retry(fn, { maxAttempts: 2 })).rejects.toBe(err);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('conditionalRetry', () => {
  it('returns immediately when the action resolves', async () => {
    const fn = jest.fn().mockResolvedValueOnce('hello');
    const isRetryable = jest.fn(() => true);

    await expect(conditionalRetry(fn, isRetryable)).resolves.toBe('hello');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(isRetryable).not.toHaveBeenCalled();
    expect(sleepMock).not.toHaveBeenCalled();
  });

  it('retries on retryable errors with correct backoff with default backoff config until the action resolves', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValueOnce('hello');

    const isRetryable = jest.fn(() => true);

    await expect(conditionalRetry(fn, isRetryable)).resolves.toBe('hello');

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);
    expect(backoffMock).toHaveBeenCalledWith(1, {});
  });

  it('makes up to 10 retries by default before rejecting', async () => {
    const fn = jest.fn().mockRejectedValue(err);
    const isRetryable = jest.fn(() => true);

    await expect(conditionalRetry(fn, isRetryable)).rejects.toBe(err);

    expect(fn).toHaveBeenCalledTimes(10);
    expect(sleepMock).toHaveBeenCalledTimes(9);
  });

  it('rejects if the error is not retryable', async () => {
    const fn = jest.fn().mockRejectedValue(err);
    const isRetryable = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    await expect(conditionalRetry(fn, isRetryable)).rejects.toBe(err);

    expect(isRetryable).toHaveBeenCalledTimes(2);
    expect(isRetryable).toHaveBeenCalledWith(err);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
  });

  it('has configurable max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(err);
    const isRetryable = jest.fn().mockReturnValue(true);

    const backoffConfig = {
      maxDelayMs: 10,
      exponentialRate: 2,
      useJitter: false,
      intervalMs: 100,
    };

    await expect(
      conditionalRetry(fn, isRetryable, { maxAttempts: 2, ...backoffConfig }),
    ).rejects.toBe(err);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(backoff).toHaveBeenCalledWith(1, backoffConfig);
  });
});

describe('retryUntil', () => {
  it('returns when the condition is met and returns the passing value', async () => {
    const fn = jest.fn(async () => 3);

    const result = await retryUntil(
      async () => fn(),
      (n) => n === 3,
    );

    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();

    expect(result).toEqual(3);
  });

  it('retries until the condition is met and returns the passing value', async () => {
    const fn = jest
      .fn<Promise<number>, []>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    const result = await retryUntil(
      async () => fn(),
      (n) => n > 1,
    );

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);

    expect(result).toEqual(2);
  });

  it('retries on error until the condition is met and returns the passing value', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('oh no'))
      .mockResolvedValueOnce('hello');

    const result = await retryUntil(
      async () => fn(),
      (s) => s.startsWith('h'),
    );

    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);

    expect(result).toEqual('hello');
  });

  it('bubbles up the error if one is thrown when out of retries', async () => {
    const expected = new Error('expected error');

    const fn = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('x')
      .mockResolvedValueOnce('y')
      .mockRejectedValueOnce(expected);

    await expect(() =>
      retryUntil(
        async () => fn(),
        (s) => s === 'z',
        { maxAttempts: 3 },
      ),
    ).rejects.toThrow(expected);

    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleepMock).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);
  });

  it('returns the last return value of the calback once all attempts have been made', async () => {
    const fn = jest.fn<Promise<string>, []>().mockResolvedValue('foo');

    const result = await retryUntil(
      async () => fn(),
      (s) => s === 'bar',
      { maxAttempts: 2 },
    );

    expect(result).toBe('foo');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(BACKOFF_MS);
  });
});
