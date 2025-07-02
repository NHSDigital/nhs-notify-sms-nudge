import {
  BatchResultErrorEntry,
  ChangeMessageVisibilityBatchCommand,
  ChangeMessageVisibilityBatchCommandInput,
  ChangeMessageVisibilityBatchRequestEntry,
  ChangeMessageVisibilityBatchResultEntry,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { BatchRetry } from './batch-retry';

export class BatchSetVisibility extends BatchRetry<
  ChangeMessageVisibilityBatchCommand,
  ChangeMessageVisibilityBatchCommandInput,
  ChangeMessageVisibilityBatchRequestEntry,
  ChangeMessageVisibilityBatchResultEntry,
  BatchResultErrorEntry
> {
  constructor(sqsClient: SQSClient) {
    super((cmd) => sqsClient.send(cmd), ChangeMessageVisibilityBatchCommand);
  }
}
