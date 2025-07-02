import pino, { DestinationStream, LogFn } from 'pino';
import pretty from 'pino-pretty';
import { ContextLogger, getPinoLoggerOptions } from './logger';

const prettyStream = pretty({
  colorize: false,
  singleLine: true,
  ignore: 'err.stack',
});

type LogMessage = { msg?: string } & Record<string, unknown>;

export interface MockLogger {
  logger: ContextLogger;
  rawMessages: string[];
  messages: LogMessage[];
  prettyMessages: () => string[];
  reset: () => void;
}

export function createMockLogger(level = 'info'): MockLogger {
  const rawMessages: string[] = [];
  const messages: LogMessage[] = [];
  const stream: DestinationStream = {
    write(msg) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hostname, pid, time, ...logMsg } = JSON.parse(msg);

      rawMessages.push(msg);
      messages.push(logMsg);
    },
  };
  const badErrorKeyRegex =
    /(^err.+)|(.+err$)|(.*error.*)|(.*exception.*)|(^ex?$)/i;
  const pinoLoggerOptions: pino.LoggerOptions = {
    ...getPinoLoggerOptions(),
    level,
  };
  const previousHook = pinoLoggerOptions.hooks?.logMethod;
  pinoLoggerOptions.hooks = {
    ...pinoLoggerOptions.hooks,
    logMethod(
      this: pino.Logger,
      args: Parameters<LogFn>,
      method: LogFn,
      loggedLevel: number
    ): void {
      const mergeObject = args[0];
      if (
        mergeObject &&
        typeof mergeObject === 'object' &&
        !((mergeObject as object) instanceof Error)
      ) {
        for (const key of Object.keys(mergeObject)) {
          if (
            badErrorKeyRegex.test(key) &&
            (mergeObject as Record<string, unknown>)[key] instanceof Error
          ) {
            throw new TypeError(
              `Errors must be logged under the err key (e.g logger.error({err: someError})) or pino will not stringify them correctly. Error was logged under the key: ${key}`
            );
          }
        }
      }
      if (previousHook) {
        return previousHook.call(this, args, method, loggedLevel);
      }
      return method.apply(this, args);
    },
  };
  const logger = pino(pinoLoggerOptions, stream);
  const reset = () => {
    rawMessages.length = 0;
    messages.length = 0;
  };

  return {
    logger,
    rawMessages,
    messages,
    // eslint-disable-next-line unicorn/no-array-callback-reference, @typescript-eslint/no-unsafe-argument
    prettyMessages: () => messages.map(prettyStream),
    reset,
  };
}
