// This is a Lambda entrypoint file.
// It should only export the handler function.
// The handler should be exported with CJS syntax for compatibility with OpenTelemetry / X-Ray

import { SQSEvent } from 'aws-lambda';

export const handler = async (_event: SQSEvent) => {};
