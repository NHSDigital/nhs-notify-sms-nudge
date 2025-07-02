import {
  BatchResultErrorEntry,
  DeleteMessageBatchCommand,
  DeleteMessageBatchCommandInput,
  DeleteMessageBatchRequestEntry,
  DeleteMessageBatchResultEntry,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { BatchRetry } from './batch-retry';

export class BatchDeleteMessage extends BatchRetry<
  DeleteMessageBatchCommand,
  DeleteMessageBatchCommandInput,
  DeleteMessageBatchRequestEntry,
  DeleteMessageBatchResultEntry,
  BatchResultErrorEntry
> {
  constructor(sqsClient: SQSClient) {
    super((cmd) => sqsClient.send(cmd), DeleteMessageBatchCommand);
  }
}
