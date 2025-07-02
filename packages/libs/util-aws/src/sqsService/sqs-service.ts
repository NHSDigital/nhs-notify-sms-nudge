import {
  GetQueueAttributesCommand,
  Message,
  ReceiveMessageCommand,
  ReceiveMessageCommandInput,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { BatchSendMessage } from './batch-send-message';
import { BatchDeleteMessage } from './batch-delete-message';
import { BatchSetVisibility } from './batch-set-visibility';

export type SQSMessage = Message;

export class SQSService {
  constructor(
    private sqsClient: SQSClient,
    private queueUrlPrefix: string,
    private deleteMessages = new BatchDeleteMessage(sqsClient),
    private sendMessages = new BatchSendMessage(sqsClient),
    private setVisibility = new BatchSetVisibility(sqsClient)
  ) {}

  private _getUrl(queueName: string) {
    return this.queueUrlPrefix + queueName;
  }

  async poll(
    queueName: string,
    maxMessages: number,
    waitTimeSeconds: number,
    visibilityTimeout?: number
  ): Promise<Message[]> {
    const input: ReceiveMessageCommandInput = {
      QueueUrl: this._getUrl(queueName),
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
    };
    if (visibilityTimeout !== undefined) {
      input.VisibilityTimeout = visibilityTimeout;
    }
    const result = await this.sqsClient.send(new ReceiveMessageCommand(input));

    return result.Messages || [];
  }

  async delete(queueName: string, receiptHandles: string[]) {
    return await this.deleteMessages.execute({
      QueueUrl: this._getUrl(queueName),
      Entries: receiptHandles.map((handle, index) => ({
        Id: index.toString(),
        ReceiptHandle: handle,
      })),
    });
  }

  async visibility(
    queueName: string,
    receiptHandles: string[],
    visibilityTimeout: number
  ) {
    return await this.setVisibility.execute({
      QueueUrl: this._getUrl(queueName),
      Entries: receiptHandles.map((handle, index) => ({
        Id: index.toString(),
        ReceiptHandle: handle,
        VisibilityTimeout: visibilityTimeout,
      })),
    });
  }

  /**
   * Forwards messages received from one queue to another queue.
   * Uses the original MessageGroupId as the batch Id or MessageId if not present for the outgoing messages.
   */
  async forward(queueName: string, messages: Message[]) {
    const isFifo = queueName.endsWith('.fifo');
    return await this.sendMessages.execute({
      QueueUrl: this._getUrl(queueName),
      Entries: messages.map((item) => ({
        Id: item.MessageId,
        MessageBody: item.Body,
        ...(isFifo && {
          MessageGroupId: item.Attributes?.MessageGroupId ?? item.MessageId,
          MessageDeduplicationId:
            item.Attributes?.MessageDeduplicationId ?? item.MessageId,
        }),
      })),
    });
  }

  async isAccessible(queueName: string) {
    try {
      await this.sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: this._getUrl(queueName),
        })
      );
      return true;
    } catch {
      // Assume error means the queue is not accessible
      return false;
    }
  }

  async queueSize(queueName: string) {
    const resp = await this.sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: this._getUrl(queueName),
        AttributeNames: ['ApproximateNumberOfMessages'],
      })
    );
    const msgs = resp.Attributes?.ApproximateNumberOfMessages;
    if (!msgs) {
      throw Error('Could not determine queue size');
    }

    return Number(msgs);
  }
}
