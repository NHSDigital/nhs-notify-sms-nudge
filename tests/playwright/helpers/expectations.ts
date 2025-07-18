import { test } from '@playwright/test';

const latestCaughtObjects: Map<symbol, unknown> = new Map();

test.beforeEach(() => {
  latestCaughtObjects.clear();
});

test.afterEach(async () => {
  if (latestCaughtObjects.size > 0) {
    // If we left any caught exceptions in here, then it must be because the
    // test timed out inside a call to expectToPassEventually.
    // There may be multiple nested or asynchronous calls - ideally we'd log all
    // of them, but playwright doesn't give us a good way of reporting
    // arbitrarily many errors, but the last one is likely to be most relevant.
    throw [...latestCaughtObjects.values()].pop();
  }
});

/**
 * Retry expectationFunction until it passes or until 30 seconds pass.
 *
 * This is intended to replace expect(...).toPass(), which doesn't have a time
 * limit by default so can run until the test times out, and doesn't log the
 * relevant error if the test times out.
 */
export async function expectToPassEventually<R>(
  expectationFunction: () => Promise<R>,
): Promise<R> {
  const invocationToken = Symbol('invocationToken');
  const startTime = Date.now();
  const timeout = 30;
  const delay = 1;
  let attempt = 0;

  for (;;) {
    try {
      attempt += 1;
      const result = await expectationFunction();
      latestCaughtObjects.delete(invocationToken);
      return result;
    } catch (exception: unknown) {
      latestCaughtObjects.delete(invocationToken);
      if (Date.now() - startTime > timeout * 1000) {
        console.log('Failed to finish test in time', {
          now: new Date().toISOString(),
          timeout,
          delay,
        });
        console.error(exception);
        throw exception;
      } else {
        latestCaughtObjects.set(invocationToken, exception);
        await sleep(delay);
      }
    }
  }
}

function sleep(seconds: number) {
  return new Promise<void>((resolve) => {
    if (seconds > 0) {
      setTimeout(resolve, seconds * 1000);
    } else {
      resolve();
    }
  });
}
