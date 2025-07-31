import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

export const handler: SQSHandler = async (event) => {
  const COMMANDS_QUEUE_URL = process.env.COMMANDS_QUEUE_URL!;
  const EVENTS_DLQ_URL = process.env.EVENTS_DLQ_URL!;

  for (const record of event.Records) {
    try {
      console.log('Received SQS message:', record.body);

      // Forward message to the commands queue
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: COMMANDS_QUEUE_URL,
          MessageBody: record.body,
        })
      );
    } catch (error) {
      console.error('Error processing message, sending to DLQ:', error);

      // Send the failed message to the events DLQ
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: EVENTS_DLQ_URL,
          MessageBody: record.body,
        })
      );
    }
  }
};
