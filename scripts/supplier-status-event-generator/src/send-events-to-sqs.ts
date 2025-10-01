import { SQSClient, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { SupplierStatusEvent } from 'types';
import { buildQueueUrl } from 'utils/build-queue-url';

const sqsClient = new SQSClient({ region: 'eu-west-2' });

function batchSupplierStatusEvents(
  events: SupplierStatusEvent[],
): SupplierStatusEvent[][] {
  const batches: SupplierStatusEvent[][] = [];
  for (let i = 0; i < events.length; i += 10) {
    batches.push(events.slice(i, i + 10));
  }
  return batches;
}

// Wait for X milliseconds
function wait(interval: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, interval);
  });
}

export async function sendEventsToSqs(
  events: SupplierStatusEvent[],
  interval: number,
) {
  const queueUrl = await buildQueueUrl();

  // batch events into chunks of 10 for SendMessageBatchCommand
  const batches = batchSupplierStatusEvents(events);

  const numberOfBatches = batches.length;
  let currentBatch = 0;
  let totalMessagesSuccessfullySent = 0;

  for (const batch of batches) {
    currentBatch += 1;

    const entries = batch.map((event) => ({
      Id: event.id,
      MessageBody: JSON.stringify(event),
    }));

    const command = new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: entries,
    });

    try {
      const response = await sqsClient.send(command);

      const failed = response.Failed ?? [];
      const successful = response.Successful ?? [];

      if (failed.length > 0) {
        console.warn('Some messages failed to send:', failed);
      }

      console.log(
        `Batch ${currentBatch} of ${numberOfBatches} sent: ${successful.length} messages`,
      );
      totalMessagesSuccessfullySent += successful.length;
    } catch (error) {
      console.error('Error sending batch:', error);
    }

    // Wait before sending the next batch, but skip waiting after the last batch
    if (batch !== batches.at(-1)) {
      await wait(interval);
    }
  }
  console.log(
    `Total messages successfully sent: ${totalMessagesSuccessfullySent} out of ${events.length} messages.`,
  );
}
