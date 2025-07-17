import type { SQSHandler } from 'aws-lambda';
import { SQSEvent } from 'aws-lambda';
import { logger } from 'nhs-notify-sms-nudge-utils';

const SEND_MESSAGE_URL = process.env.SEND_MESSAGE_URL!;

export const handler: SQSHandler = async (event: SQSEvent) => {
  const body = event.Records[0].body;
  const nudgeCommand = JSON.parse(body);

  logger.info('Received event', {
    messageId: event.Records[0].messageId,
    sourceEventId: nudgeCommand.sourceEventId,
    target: SEND_MESSAGE_URL,
  });
};
