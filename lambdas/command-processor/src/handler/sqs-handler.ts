import type { SQSEvent} from 'aws-lambda';
import type { CommandProcessorService } from '../app/command-processor-service';
import type { IncomingQueueMessage } from '../domain/incoming-queue-message';
import { mapQueueToDataEvent } from '../domain/mapper';

export interface CommandDependencies {
  commandProcessorService: CommandProcessorService;
}

export const createHandler = ({
  commandProcessorService,
}: CommandDependencies) =>
  async function handler(event: SQSEvent): Promise<void> {
    await Promise.all(
      event.Records.map(async ({ body }) => {
        const incoming = JSON.parse(body) as IncomingQueueMessage;
        const dataEvent = mapQueueToDataEvent(incoming);
        await commandProcessorService.process(dataEvent);
      })
    );
  };
