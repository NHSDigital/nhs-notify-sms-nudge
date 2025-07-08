//Lambda entrypoint

import { createContainer } from './container/container';
import { createHandler } from './handler/sqs-handler';

export const handler = createHandler(createContainer());
