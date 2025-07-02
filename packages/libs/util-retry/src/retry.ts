import { type BackoffConfig, backoff } from './backoff';
import { sleepMs } from './sleep';

export type RetryConfig = BackoffConfig & { maxAttempts?: number };

export type RetryConditionFn<T> = (result: T) => boolean;
export type RetryErrorConditionFn = (err: unknown) => boolean;

type RetryCallback<T> = (attempt: number) => Promise<T>;

/**
 * Retries the given function until maxAttempts is reached. Gives fine control on whether an error can be retried or not.
 */
export async function conditionalRetry<T>(
  fn: RetryCallback<T>,
  isErrorRetryable: RetryErrorConditionFn,
  config: RetryConfig = {},
  attempt = 1
): Promise<T> {
  const { maxAttempts = 10, ...backoffConfig } = config;

  try {
    return await fn(attempt);
  } catch (err) {
    if (isErrorRetryable(err) && attempt < maxAttempts) {
      await sleepMs(backoff(attempt, backoffConfig));

      return await conditionalRetry(fn, isErrorRetryable, config, attempt + 1);
    }

    throw err;
  }
}

/**
 * Retries the given function until maxAttempts is reached and no errors are thrown.
 */
export async function retry<T>(
  fn: RetryCallback<T>,
  config: RetryConfig = {}
): Promise<T> {
  return await conditionalRetry(fn, () => true, config);
}

/**
 * Retries the given function until the given condition is met or maxAttempts is reached and no errors are thrown.
 * If the condition is never satisfied, returns the last value returned by `fn`.
 */
export async function retryUntil<T>(
  fn: RetryCallback<T>,
  condition: RetryConditionFn<T>,
  config: RetryConfig = {},
  attempt = 1
): Promise<T> {
  const { maxAttempts = 10, ...backoffConfig } = config;

  let error: unknown;
  let result!: T;

  try {
    result = await fn(attempt);

    if (condition(result)) {
      return result;
    }
  } catch (e) {
    error = e;
  }

  if (attempt < maxAttempts) {
    await sleepMs(backoff(attempt, backoffConfig));

    return await retryUntil(fn, condition, config, attempt + 1);
  }

  if (error) {
    throw error;
  }

  return result;
}
