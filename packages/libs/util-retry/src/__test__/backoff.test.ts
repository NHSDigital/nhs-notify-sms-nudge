import { backoff } from '../backoff';

const mockRandom = jest.spyOn(Math, 'random');

type Case = [number, number, number?];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('backoff', () => {
  describe('default config parameters', () => {
    const defaultParameterCases: Case[] = [
      [0, 89, 0.2806559679858154],
      [1, 205, 0.5524135154754188],
      [2, 467, 0.8393305073494388],
      [3, 624, 0.06182114239898806],
      [4, 1993, 0.9918425254961059],
    ];

    describe('no config passed', () => {
      test.each(defaultParameterCases)(
        'attempt %i returns %i ms - jitter is applied',
        (attempt, expected, random) => {
          mockRandom.mockReturnValue(random as number);
          expect(backoff(attempt)).toBe(expected);
          expect(mockRandom).toHaveBeenCalled();
        }
      );
    });

    describe('empty config object', () => {
      test.each(defaultParameterCases)(
        'attempt %i returns %i ms',
        (attempt, expected, random) => {
          mockRandom.mockReturnValue(random as number);
          expect(backoff(attempt, {})).toBe(expected);
          expect(mockRandom).toHaveBeenCalled();
        }
      );
    });
  });

  describe('jitter disabled', () => {
    const noJitterParameterCases: Case[] = [
      [0, 100],
      [1, 200],
      [2, 400],
      [3, 800],
      [4, 1600],
    ];

    test.each(noJitterParameterCases)(
      'attempt %i returns %i ms',
      (attempt, expected) => {
        expect(backoff(attempt, { useJitter: false })).toBe(expected);
        expect(mockRandom).not.toHaveBeenCalled();
      }
    );
  });

  describe('with overridden exponential rate (1.5)', () => {
    const expRateParameterCases: Case[] = [
      [0, 133.33333333333331],
      [1, 200],
      [2, 300],
      [3, 450],
      [4, 675],
    ];

    test.each(expRateParameterCases)(
      'attempt %i returns %i ms',
      (attempt, expected) => {
        expect(
          backoff(attempt, { exponentialRate: 1.5, useJitter: false })
        ).toBe(expected);
      }
    );
  });

  describe('with overridden interval (1000ms)', () => {
    const expRateParameterCases: Case[] = [
      [0, 500],
      [1, 1000],
      [2, 2000],
      [3, 4000],
      [4, 8000],
    ];

    test.each(expRateParameterCases)(
      'attempt %i returns %i ms',
      (attempt, expected) => {
        expect(backoff(attempt, { intervalMs: 1000, useJitter: false })).toBe(
          expected
        );
      }
    );
  });

  describe('with overridden maxDelay (500ms)', () => {
    const expRateParameterCases: Case[] = [
      [0, 100],
      [1, 200],
      [2, 400],
      [3, 500],
      [4, 500],
    ];

    test.each(expRateParameterCases)(
      'attempt %i returns %i ms',
      (attempt, expected) => {
        expect(backoff(attempt, { maxDelayMs: 500, useJitter: false })).toBe(
          expected
        );
      }
    );
  });
});
