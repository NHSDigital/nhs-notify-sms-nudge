import { filterUnnotifiedEvents } from 'app/event-filters';
import { transformEvent } from 'app/event-transform';
import { parseSqsRecord } from 'app/parse-cloud-event';
import { SQSBatchItemFailure, SQSBatchResponse, SQSEvent, SQSRecord } from 'aws-lambda';
import { NudgeCommand } from 'domain/nudge-command';
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
    logger.info(`Received SQS Event of ${event.Records.length} record(s)`);
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
          logger.error({
            error: error.message,
            description: 'Failed processing record',
            messageId: sqsRecord.messageId,
          });

          batchItemFailures.push({ itemIdentifier: sqsRecord.messageId });
        }
      })
    );

    if (batchItemFailures.length === 0) {
      logger.info('All records processed successfully');
    }

    return { batchItemFailures };
  };
