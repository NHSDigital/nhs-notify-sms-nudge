export class RequestAlreadyReceivedError extends Error {
  readonly cause: Error;

  readonly correlationId: string;

  constructor(cause: Error, correlationId: string) {
    super('The request has already been received.');

    this.cause = cause;
    this.correlationId = correlationId;
  }
}
