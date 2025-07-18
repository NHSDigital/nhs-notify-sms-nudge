import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
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
    logger.info(`Received SQS Event of ${sqsEvent.Records.length} record(s)`);
    const batchItemFailures: SQSBatchItemFailure[] = [];
    await Promise.all(
      sqsEvent.Records.map(async (sqsRecord: SQSRecord) => {
        try {
          const incoming = parseSqsRecord(sqsRecord, logger);
          const request = mapQueueToRequest(incoming);
          await commandProcessorService.process(request);
        } catch (error: any) {
          logger.error({
            error: error.message,
            description: 'Failed processing message',
            messageId: sqsRecord.messageId,
          });
          batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
      }),
    );

    return { batchItemFailures };
  };
