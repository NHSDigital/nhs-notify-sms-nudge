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
  attempt = 1,
): Promise<T> {
  const { maxAttempts = 10, ...backoffConfig } = config;

  try {
    return await fn(attempt);
  } catch (error) {
    if (isErrorRetryable(error) && attempt < maxAttempts) {
      await sleepMs(backoff(attempt, backoffConfig));

      return conditionalRetry(fn, isErrorRetryable, config, attempt + 1);
    }

    throw error;
  }
}

/**
 * Retries the given function until maxAttempts is reached and no errors are thrown.
 */
export async function retry<T>(
  fn: RetryCallback<T>,
  config: RetryConfig = {},
): Promise<T> {
  return conditionalRetry(fn, () => true, config);
}

/**
 * Retries the given function until the given condition is met or maxAttempts is reached and no errors are thrown.
 * If the condition is never satisfied, returns the last value returned by `fn`.
 */
export async function retryUntil<T>(
  fn: RetryCallback<T>,
  condition: RetryConditionFn<T>,
  config: RetryConfig = {},
  attempt = 1,
): Promise<T> {
  const { maxAttempts = 10, ...backoffConfig } = config;

  let error: unknown;
  let result!: T;

  try {
    result = await fn(attempt);

    if (condition(result)) {
      return result;
    }
  } catch (error_) {
    error = error_;
  }

  if (attempt < maxAttempts) {
    await sleepMs(backoff(attempt, backoffConfig));

    return retryUntil(fn, condition, config, attempt + 1);
  }

  if (error instanceof Error) {
    throw error;
  }

  return result;
}
