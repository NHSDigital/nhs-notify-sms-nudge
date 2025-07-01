// This is a Lambda entrypoint file.
// It should only export the handler function.
// The handler should be exported with CJS syntax for compatibility with OpenTelemetry / X-Ray

import type { Handler } from 'aws-lambda';
import { createContainer } from './container';
import { createHandler } from './apis/lambda';

const handler: Handler = createHandler(createContainer());

module.exports = { handler };
