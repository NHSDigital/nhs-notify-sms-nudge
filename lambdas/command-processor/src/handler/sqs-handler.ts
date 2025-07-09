import type { SQSEvent} from 'aws-lambda';
import type { CommandProcessorService } from '../app/command-processor-service';
import type { NudgeCommand } from '../domain/nudge-command';
import { mapQueueToRequest } from '../domain/mapper';

export interface CommandDependencies {
  commandProcessorService: CommandProcessorService;
}

export const createHandler = ({
  commandProcessorService,
}: CommandDependencies) =>
  async function handler(event: SQSEvent): Promise<void> {
    await Promise.all(
      event.Records.map(async ({ body }) => {
        const incoming = JSON.parse(body) as NudgeCommand;
        const request = mapQueueToRequest(incoming);
        await commandProcessorService.process(request);
      })
    );
  };
