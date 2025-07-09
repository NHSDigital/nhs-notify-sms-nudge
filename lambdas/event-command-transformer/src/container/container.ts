import { logger } from "nhs-notify-sms-nudge-utils/logger";
import { TransformDependencies } from "src/handler/sqs-handler";
import { SqsRepository } from "src/infra/SqsRepository";
import { sqsClient } from "src/infra/sqs-client";

const COMMANDS_QUEUE_URL = process.env.COMMANDS_QUEUE_URL!;

export const createContainer = (): TransformDependencies => {
  const sqsRepository = new SqsRepository(sqsClient);

  return { sqsRepository, commandsQueueUrl: COMMANDS_QUEUE_URL, logger };
};
