import {
  GetQueueUrlCommand,
  PurgeQueueCommand,
  PurgeQueueCommandInput,
  SendMessageCommand,
  SendMessageCommandOutput,
} from '@aws-sdk/client-sqs';
import { sqsClient } from 'nhs-notify-sms-nudge-utils';

export async function getQueueURl(queueName: string) {
  const getQueueUrlCommand = new GetQueueUrlCommand({ QueueName: queueName });
  const { QueueUrl } = await sqsClient.send(getQueueUrlCommand);
  return QueueUrl;
}

export const sendMessagetoSqs = async (
  queueName: string,
  messageBody: Record<string, unknown>,
  deduplicationId?: string,
): Promise<SendMessageCommandOutput> => {
  const QueueUrl = await getQueueURl(queueName);
  const sendMessageCommand = new SendMessageCommand({
    QueueUrl,
    MessageBody: JSON.stringify(messageBody),
    ...(deduplicationId && { MessageDeduplicationId: deduplicationId }),
    ...(queueName.endsWith('.fifo') && { MessageGroupId: 'message-group-id' }),
  });
  const res = await sqsClient.send(sendMessageCommand);
  return res;
};

export async function purgeQueueSync(queueName: string) {
  const queueUrl = await getQueueURl(queueName);
  const input: PurgeQueueCommandInput = {
    QueueUrl: queueUrl,
  };

  const res = await sqsClient.send(new PurgeQueueCommand(input));
  return res;
}
