import { expect } from '@playwright/test';

expect.extend({
  /**
   * Asserts that a value is parsable as a date, and is roughly within the given range.
   * "Roughly" means that the received value can be within 1 second either side of the range.
   * This helps deal with local machines being out of sync with remote servers
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async toBeDateRoughlyBetween(received: any, range: [Date, Date]) {
    const date = new Date(received);

    if (Number.isNaN(date.valueOf())) {
      return {
        message: () => 'Expected value to be parsable as a Date.',
        actual: received,
        pass: false,
      };
    }

    const [min, max] = [...range].sort();

    const minMs = Math.floor(min.valueOf() / 1000) * 1000; // round min down to the nearest second
    const maxMs = Math.ceil(max.valueOf() / 1000) * 1000; // round max up to the nearest second
    const receivedDown = Math.floor(date.valueOf() / 1000) * 1000; // round the received number down to the nearest second
    const receivedUp = Math.ceil(date.valueOf() / 1000) * 1000; // round the received number up to the nearest second

    // if its too low, it's less than 1 second too low
    if (receivedUp < minMs) {
      return {
        message: () =>
          `Expected parsed timestamp ${date.valueOf()} to be roughly less than ${minMs}.`,
        actual: received,
        expected: min,
        pass: false,
      };
    }

    // if its too high, it's less than 1 second too high
    if (receivedDown > maxMs) {
      return {
        message: () =>
          `Expected parsed timestamp ${date.valueOf()} to be roughly more than ${maxMs}.`,
        actual: received,
        expected: max,
        pass: false,
      };
    }

    return { pass: true, message: () => '' };
  },
});
