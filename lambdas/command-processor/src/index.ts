import type { SQSHandler } from 'aws-lambda';
import { SQSEvent } from 'aws-lambda';
import { logger } from 'nhs-notify-sms-nudge-utils';

export const handler: SQSHandler = async (event: SQSEvent) => {
  const body = event.Records[0].body;
  const nudgeCommand = JSON.parse(body);
  const messageReference = `${nudgeCommand.requestItemId}-${nudgeCommand.requestItemPlanId}`;

  logger.info('Successfully processed request', {
    messageReference,
  });
};
