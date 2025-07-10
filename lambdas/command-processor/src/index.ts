// This is a Lambda entrypoint file.

import type { SQSEvent } from 'aws-lambda';
import { createContainer } from 'container';
import { createHandler as createSqsHandler } from 'handler/sqs-handler';

export const handler = async (sqsEvent: SQSEvent) => {
  const container = await createContainer();
  const sqsHandler = createSqsHandler(container);
  return sqsHandler(sqsEvent);
};
