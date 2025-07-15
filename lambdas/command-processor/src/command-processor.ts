// This is a Lambda entrypoint file.
// It should only export the handler function.
// The handler should be exported with CJS syntax for compatibility with OpenTelemetry / X-Ray

import { SQSEvent } from 'aws-lambda';
import { logger } from 'nhs-notify-sms-nudge-utils';

const SEND_MESSAGE_URL = process.env.SEND_MESSAGE_URL!;

export const handler = async (_event: SQSEvent) => {
  logger.info('Received event. Would target %s', SEND_MESSAGE_URL);
};
