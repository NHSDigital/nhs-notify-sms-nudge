import {
  BatchResultErrorEntry,
  SendMessageBatchCommand,
  SendMessageBatchCommandInput,
  SendMessageBatchRequestEntry,
  SendMessageBatchResultEntry,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { ContextLogger, createLogger } from '@comms/util-logger';
import { BatchRetry } from './batch-retry';

export class BatchSendMessage extends BatchRetry<
  SendMessageBatchCommand,
  SendMessageBatchCommandInput,
  SendMessageBatchRequestEntry,
  SendMessageBatchResultEntry,
  BatchResultErrorEntry
> {
  constructor(sqsClient: SQSClient, logger: ContextLogger = createLogger()) {
    super((cmd) => sqsClient.send(cmd), SendMessageBatchCommand, logger);
  }
}
