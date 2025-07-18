import type {
  SQSEvent,
  SQSRecord,
  SQSBatchResponse,
  SQSBatchItemFailure,
} from 'aws-lambda';
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
  async function handler(sqsEvent: SQSEvent): Promise<SQSBatchResponse> {
    logger.info('Received SQS Event of %s record(s)', sqsEvent.Records.length);
    const batchItemFailures: SQSBatchItemFailure[] = [];
    await Promise.all(
      sqsEvent.Records.map(async (sqsRecord: SQSRecord) => {
        try {
          const incoming = parseSqsRecord(sqsRecord, logger);
          const request = mapQueueToRequest(incoming);
          await commandProcessorService.process(request);
        } catch (e) {
          logger.error({
            err: e,
            description:
              'Failed processing message',
          });
          batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
      }),
    );

    return {batchItemFailures};
  };
