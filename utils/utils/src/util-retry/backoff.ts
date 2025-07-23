export function jitter(ms: number): number {
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
    maxDelayMs = 10_000,
    intervalMs = 200,
    exponentialRate = 2,
    useJitter = true,
  } = config;

  const nextDelay = Math.min(
    intervalMs * exponentialRate ** (attempt - 1),
    maxDelayMs
  );

  return useJitter ? jitter(nextDelay) : nextDelay;
};
