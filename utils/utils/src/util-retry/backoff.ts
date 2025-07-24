export function jitter(ms: number): number {
  // eslint-disable-next-line sonarjs/pseudo-random
  const offset = (Math.random() - 0.5) / 2;
  const multiplier = offset + 1;
  return Math.floor(multiplier * ms);
}

export type BackoffConfig = {
  maxDelayMs?: number;
  intervalMs?: number;
  exponentialRate?: number;
  useJitter?: boolean;
};

export const backoff = (attempt: number, config: BackoffConfig = {}) => {
  const {
    exponentialRate = 2,
    intervalMs = 200,
    maxDelayMs = 10_000,
    useJitter = true,
  } = config;

  const nextDelay = Math.min(
    intervalMs * exponentialRate ** (attempt - 1),
    maxDelayMs,
  );

  return useJitter ? jitter(nextDelay) : nextDelay;
};
