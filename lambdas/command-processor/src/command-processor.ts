// This is a Lambda entrypoint file.
// It should only export the handler function.
// The handler should be exported with CJS syntax for compatibility with OpenTelemetry / X-Ray

import type { Handler, SQSEvent } from 'aws-lambda';
import { createContainer } from './container';
import { createHandler as createSqsHandler } from './handler/sqs-handler';

const handler: Handler = async (event: SQSEvent) => {
  const container = await createContainer();
  const sqsHandler = createSqsHandler(container);
  return sqsHandler(event);
};

module.exports = { handler };
