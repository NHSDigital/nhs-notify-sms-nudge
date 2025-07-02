import pino, { BaseLogger, Bindings, LogFn } from 'pino';

interface ErrorLogFn {
  <T extends { err: unknown }>(obj: T, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export type ContextLogger = Omit<BaseLogger, 'child' | 'error'> & {
  error: ErrorLogFn;
  child(bindings: Bindings): ContextLogger;
  setBindings(bindings: Bindings): void;
};

export type { Logger } from 'pino';

export const LOGGER_REDACT_LIST = [
  'e.config',
  'e.request',
  'e.response',
  'e.CancellationReasons[*].Item',
  'err.config',
  'err.request',
  'err.response',
  'err.CancellationReasons[*].Item',
  'error.config',
  'error.request',
  'error.response',
  'error.CancellationReasons[*].Item',
];

export function getPinoLoggerOptions(): pino.LoggerOptions {
  return {
    hooks: {
      logMethod(this: pino.Logger, args: Parameters<LogFn>, method: LogFn) {
        const mergeObject = args[0] as unknown as Record<string, unknown>;
        if (
          args.length === 1 &&
          mergeObject &&
          typeof mergeObject === 'object' &&
          typeof mergeObject.description === 'string'
        ) {
          // Pino allows a manually provided 'description' field to be overwritten by the field from an Error, so let's
          // prevent this by adding an explicit log message as the second argument (unless one is already provided),
          // which can override the message from the Error or the description key.
          args.push(mergeObject.description);
        }
        return method.apply(this, args);
      },
    },
    messageKey: 'description',
    formatters: {
      level(label: string) {
        return { level: label };
      },
      log(object: Record<string, unknown>): Record<string, unknown> {
        // Pino implements a custom JSON serializer, which erroneously logs the description twice if it was provided
        // in the object and as a parameter - giving json log lines like `{"description":"foo","description":"bar"}`.
        // In 'logMethod' we copy it into the message parameter, so here we can delete it, preventing the duplicate from
        // being serialized
        const withoutDescription = { ...object };
        delete withoutDescription.description;
        return withoutDescription;
      },
    },
    redact: LOGGER_REDACT_LIST,
  };
}

export function createLogger(destination?: string): ContextLogger {
  const componentName = process.env.COMPONENT; // This is inlined by webpack at build time using EnvironmentPlugin
  const componentVersion = process.env.CODE_VERSION;
  const environment = process.env.ENVIRONMENT;
  const logLevel = process.env.LOG_LEVEL || 'info';

  const options: pino.LoggerOptions = {
    ...getPinoLoggerOptions(),
    level: logLevel || 'info',
    base: {
      ...(environment && { environment }),
      ...(componentVersion && { componentVersion }),
      ...(componentName && { componentName }),
    },
  };
  const logger: BaseLogger = pino(
    options,
    pino.destination({
      sync: true,
      ...(destination && { dest: destination }),
    })
  );

  return Object.assign(logger, {}) as ContextLogger;
}

export const log = createLogger();
