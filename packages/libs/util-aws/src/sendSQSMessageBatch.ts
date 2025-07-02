import { randomUUID } from 'crypto';
import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from './sqsClient';

export const sendSQSMessage = async (
  QueueUrl: string,
  Items: Record<string, unknown>[],
  MessageGroupId: string | null = 'default-message-group'
) => {
  const command = new SendMessageBatchCommand({
    QueueUrl,
    Entries: Items.map((item) => ({
      Id: randomUUID(),
      MessageBody: JSON.stringify(item),
      ...(MessageGroupId && { MessageGroupId }),
    })),
  });

  return await sqsClient.send(command);
};
