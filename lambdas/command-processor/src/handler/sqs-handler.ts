import type {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';
import { Logger } from 'nhs-notify-sms-nudge-utils';
import { mapQueueToRequest } from 'domain/mapper';
import { parseSqsRecord } from 'app/parse-nudge-command';
import type { CommandProcessorService } from 'app/command-processor-service';

export interface CommandDependencies {
  commandProcessorService: CommandProcessorService;
  routingPlanId: string;
  logger: Logger;
}

export const createHandler = ({
  commandProcessorService,
  logger,
  routingPlanId,
}: CommandDependencies) =>
  async function handler(sqsEvent: SQSEvent): Promise<SQSBatchResponse> {
    const receivedItemCount = sqsEvent.Records.length;

    logger.info(`Received SQS Event of ${receivedItemCount} record(s)`);

    const batchItemFailures: SQSBatchItemFailure[] = [];

    await Promise.all(
      sqsEvent.Records.map(async (sqsRecord: SQSRecord) => {
        try {
          const incoming = parseSqsRecord(sqsRecord, logger);
          const request = mapQueueToRequest(incoming, routingPlanId);
          await commandProcessorService.process(request);
        } catch (error: any) {
          logger.warn({
            error: error.message,
            description: 'Failed processing message',
            messageId: sqsRecord.messageId,
          });
          batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
      }),
    );

    const processedItemCount = receivedItemCount - batchItemFailures.length;
    logger.info(
      `${processedItemCount} of ${receivedItemCount} records processed successfully`,
    );

    return { batchItemFailures };
  };
