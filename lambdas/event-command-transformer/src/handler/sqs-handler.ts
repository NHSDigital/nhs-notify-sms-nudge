import { filterUnnotifiedEvents } from 'app/event-filters';
import { transformEvent } from 'app/event-transform';
import { parseSqsRecord } from 'app/parse-cloud-event';
import { SQSEvent } from 'aws-lambda';
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
  async function handler(event: SQSEvent) {
    logger.info(`Received SQS Event of ${event.Records.length} record(s)`);

    const transformedCommands: NudgeCommand[] = event.Records.map(
      (value, _index) => parseSqsRecord(value, logger),
    )
      .filter((value, _index) => filterUnnotifiedEvents(value, logger))
      .map((value, _index) => transformEvent(value, logger));

    if (transformedCommands.length === 0) {
      logger.info('There are no Nudge Commands to issue');
    }

    for (const command of transformedCommands) {
      logger.info('Sending Nudge Command', {
        cloudEventId: command.sourceEventId,
        requestItemId: command.requestItemId,
        requestItemPlanId: command.requestItemPlanId,
      });
      await sqsRepository.send(commandsQueueUrl, command);
    }
  };
