import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import { mapQueueToRequest } from 'domain/mapper';
import { parseSqsRecord } from 'app/parse-nudge-command';
import type { CommandProcessorService } from 'app/command-processor-service';

export interface CommandDependencies {
  commandProcessorService: CommandProcessorService;
  logger: Logger;
}

export const createHandler = ({
  commandProcessorService,
  logger,
}: CommandDependencies) =>
  async function handler(sqsEvent: SQSEvent): Promise<void> {
    logger.info('Received SQS Event of %s record(s)', sqsEvent.Records.length);
    await Promise.all(
      sqsEvent.Records.map(async (sqsRecord: SQSRecord) => {
        const incoming = parseSqsRecord(sqsRecord, logger);
        const request = mapQueueToRequest(incoming);
        await commandProcessorService.process(request);
      }),
    );
  };
