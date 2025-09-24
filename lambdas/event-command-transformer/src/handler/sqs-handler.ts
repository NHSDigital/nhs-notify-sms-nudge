import { filterUnnotifiedEvents } from 'app/event-filters';
import { transformEvent } from 'app/event-transform';
import { parseSqsRecord } from 'app/parse-cloud-event';
import {
  SQSBatchItemFailure,
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';
import { Logger, SqsRepository } from 'nhs-notify-sms-nudge-utils';

export type TransformDependencies = {
  sqsRepository: SqsRepository;
  commandsQueueUrl: string;
  logger: Logger;
};

export const createHandler = ({
  commandsQueueUrl,
  logger,
  sqsRepository,
}: TransformDependencies) =>
  async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
    const receivedItemCount = event.Records.length;

    logger.info(`Received SQS Event of ${receivedItemCount} record(s)`);

    const batchItemFailures: SQSBatchItemFailure[] = [];

    await Promise.all(
      event.Records.map(async (sqsRecord: SQSRecord) => {
        try {
          const parsed = parseSqsRecord(sqsRecord, logger);

          if (!filterUnnotifiedEvents(parsed, logger)) {
            logger.info(`Skipping record ${sqsRecord.messageId}`);
            return;
          }

          const command = transformEvent(parsed, logger);

          logger.info('Sending Nudge Command', {
            cloudEventId: command.sourceEventId,
            requestItemId: command.requestItemId,
            requestItemPlanId: command.requestItemPlanId,
          });

          await sqsRepository.send(commandsQueueUrl, command);
        } catch (error: any) {
          logger.warn({
            error: error.message,
            description: 'Failed processing record',
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
