import { SqsRepository, sqsClient } from "@sms/util-aws";
import { TransformDependencies } from "../handler/sqs-handler";

const COMMANDS_QUEUE_URL = process.env.COMMANDS_QUEUE_URL!;

export const createContainer = (): TransformDependencies => {

  const sqsRepository = new SqsRepository(sqsClient);

  return { sqsRepository, commandsQueueUrl: COMMANDS_QUEUE_URL }
}
