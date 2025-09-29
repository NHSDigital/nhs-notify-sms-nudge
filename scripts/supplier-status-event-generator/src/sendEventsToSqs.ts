import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { SupplierStatusEvent } from "./types";
import { buildQueueUrl } from "./utils/buildQueueUrl";

const sqsClient = new SQSClient({ region: "eu-west-2" });

export async function sendEventsToSqs(events: SupplierStatusEvent[], interval: number) {
  const queueUrl = await buildQueueUrl();

  // batch events into chunks of 10 for SendMessageBatchCommand
  const batches = batchSupplierStatusEvents(events);

  for (const batch of batches) {
    const entries = batch.map((event, index) => ({
      Id: `msg-${Date.now()}-${index}`,
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
        console.warn("Some messages failed to send:", failed);
      }

      console.log(`Batch sent: ${successful.length} messages`);
      
    } catch (err) {
      console.error("Error sending batch:", err);
    }

    // Wait before sending the next batch, but skip waiting after the last batch
    if (batch !== batches[batches.length - 1]) {
      await wait(interval);
    }
  }
}

function batchSupplierStatusEvents(events: SupplierStatusEvent[]): SupplierStatusEvent[][] {
  const batches: SupplierStatusEvent[][] = [];
  for (let i = 0; i < events.length; i += 10) {
    batches.push(events.slice(i, i + 10));
  }
  return batches;
}

// Wait for X milliseconds
function wait(interval: number) {
  return new Promise(resolve => setTimeout(resolve, interval));
}
