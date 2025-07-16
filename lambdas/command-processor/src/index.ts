import type { SQSHandler } from 'aws-lambda';

import { SQSEvent } from 'aws-lambda';
import { logger } from 'nhs-notify-sms-nudge-utils';

const SEND_MESSAGE_URL = process.env.SEND_MESSAGE_URL!;

export const handler: SQSHandler = async (event: SQSEvent) => {
  logger.info('Received event', {
    message0Id: event.Records[0].messageId,
    target: SEND_MESSAGE_URL,
  });
};
