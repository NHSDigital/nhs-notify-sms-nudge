import { backoff } from 'util-retry/backoff';

const mockRandom = jest.spyOn(Math, 'random');

type Case = [number, number, number?];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('backoff', () => {
  describe('default config parameters', () => {
    const defaultParameterCases: Case[] = [
      [0, 89, 0.280_655_967_985_815_4],
      [1, 205, 0.552_413_515_475_418_8],
      [2, 467, 0.839_330_507_349_438_8],
      [3, 624, 0.061_821_142_398_988_06],
      [4, 1993, 0.991_842_525_496_105_9],
    ];

    describe('no config passed', () => {
      test.each(defaultParameterCases)(
        'attempt %i returns %i ms - jitter is applied',
        (attempt, expected, random) => {
          mockRandom.mockReturnValue(random as number);
          expect(backoff(attempt)).toBe(expected);
          expect(mockRandom).toHaveBeenCalled();
        },
      );
    });

    describe('empty config object', () => {
      test.each(defaultParameterCases)(
        'attempt %i returns %i ms',
        (attempt, expected, random) => {
          mockRandom.mockReturnValue(random as number);
          expect(backoff(attempt, {})).toBe(expected);
          expect(mockRandom).toHaveBeenCalled();
        },
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
      },
    );
  });

  describe('with overridden exponential rate (1.5)', () => {
    const expRateParameterCases: Case[] = [
      [0, 133.333_333_333_333_31],
      [1, 200],
      [2, 300],
      [3, 450],
      [4, 675],
    ];

    test.each(expRateParameterCases)(
      'attempt %i returns %i ms',
      (attempt, expected) => {
        expect(
          backoff(attempt, { exponentialRate: 1.5, useJitter: false }),
        ).toBe(expected);
      },
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
          expected,
        );
      },
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
          expected,
        );
      },
    );
  });
});
