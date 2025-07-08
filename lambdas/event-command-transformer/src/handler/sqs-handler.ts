import { SQSEvent } from "aws-lambda";
import { Logger } from "nhs-notify-sms-nudge-utils/logger";
import { filterUnnotifiedEvents } from "../app/event-filters";
import { transformEvent } from "../app/event-transform";
import { parseSqsRecord } from "../app/parse-cloud-event";
import { NudgeCommand } from "../domain/nudge-command";
import { SqsRepository } from "../infra/SqsRepository";


export type TransformDependencies = {
  sqsRepository: SqsRepository;
  commandsQueueUrl: string;
  logger: Logger;
};

export const createHandler = ({ sqsRepository, commandsQueueUrl, logger }: TransformDependencies) =>
  async function handler(event: SQSEvent) {

    logger.info('Received SQS Event of %s record(s)', event.Records.length);

    const transformedCommands: NudgeCommand[] = event.Records
      .map((value, index) => parseSqsRecord(value, logger))
      .filter((value, index) => filterUnnotifiedEvents(value, logger))
      .map((value, index) => transformEvent(value, logger));

    if (transformedCommands.length == 0) {
      logger.info("There are no Nudge Commands to issue");
    }

    for (const command of transformedCommands) {
      logger.info("Sending nudge for event ID: %s", command.sourceEventId)
      await sqsRepository.send(commandsQueueUrl, command);
    }
  }
