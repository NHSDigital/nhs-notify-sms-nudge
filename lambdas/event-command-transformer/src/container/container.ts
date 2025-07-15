import { TransformDependencies } from 'handler/sqs-handler';
import { SqsRepository, sqsClient } from 'nhs-notify-sms-nudge-utils';
import { logger } from 'nhs-notify-sms-nudge-utils/logger';

const COMMANDS_QUEUE_URL = process.env.COMMANDS_QUEUE_URL!;

export const createContainer = (): TransformDependencies => {
  const sqsRepository = new SqsRepository(sqsClient);

  return { sqsRepository, commandsQueueUrl: COMMANDS_QUEUE_URL, logger };
};
