// Lambda entrypoint

import { createContainer } from "src/container/container";
import { createHandler } from "src/handler/sqs-handler";

export const handler = createHandler(createContainer());
