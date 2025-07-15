import type { SQSHandler } from 'aws-lambda';

import { SQSEvent } from 'aws-lambda';
import { logger } from 'nhs-notify-sms-nudge-utils';

const SEND_MESSAGE_URL = process.env.SEND_MESSAGE_URL!;

export const handler: SQSHandler = async (_event: SQSEvent) => {
  logger.info('Received event. Would target %s', SEND_MESSAGE_URL);
};
