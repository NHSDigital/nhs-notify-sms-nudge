import { ContextLogger } from './logger';

export const expectLogger = expect.objectContaining({
  info: expect.any(Function),
  warn: expect.any(Function),
  error: expect.any(Function),
}) as unknown as ContextLogger;
