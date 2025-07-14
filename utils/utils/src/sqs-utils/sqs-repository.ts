import {
  GetQueueAttributesCommand,
  ListQueuesCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

export class SqsRepository {
  constructor(private readonly sqsClient: SQSClient) {}

  async getAllQueueNamesByPrefix(prefix: string) {
    const { QueueUrls } = await this.sqsClient.send(
      new ListQueuesCommand({
        QueueNamePrefix: prefix,
      }),
    );

    return QueueUrls ?? [];
  }

  async getNumberOfMessagesNotVisible(queueUrl: string) {
    const { Attributes } = await this.sqsClient.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessagesNotVisible'],
      }),
    );

    return Attributes?.ApproximateNumberOfMessagesNotVisible;
  }

  async send(queueUrl: string, item: unknown) {
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(item),
      }),
    );
  }
}
