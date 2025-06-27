import { createContainer } from './container/container';
import { createHandler } from './handler/sqs-handler';

const handler = createHandler(createContainer());

module.exports = { handler };
