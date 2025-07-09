import { TransformDependencies } from "handler/sqs-handler";
import { sqsClient } from "infra/sqs-client";
import { SqsRepository } from "infra/sqs-repository";
import { logger } from "nhs-notify-sms-nudge-utils/logger";

const COMMANDS_QUEUE_URL = process.env.COMMANDS_QUEUE_URL!;

export const createContainer = (): TransformDependencies => {
  const sqsRepository = new SqsRepository(sqsClient);

  return { sqsRepository, commandsQueueUrl: COMMANDS_QUEUE_URL, logger };
};
