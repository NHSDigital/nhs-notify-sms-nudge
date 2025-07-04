import { SQSEvent } from "aws-lambda";
import { filterUnnotifiedEvents } from "../app/event-filters";
import { transformEvent } from "../app/event-transform";
import { parseSqsRecord } from "../app/parse-cloud-event";
import { NudgeCommand } from "../domain/nudge-command";
import { SqsRepository } from "../infra/SqsRepository";


export type TransformDependencies = {
  sqsRepository: SqsRepository;
  commandsQueueUrl: string;
};

export const createHandler = ({ sqsRepository, commandsQueueUrl }: TransformDependencies) =>
  async function handler(event: SQSEvent): Promise<Void> {

    const transformedCommands: NudgeCommand[] = event.Records
      .map(parseSqsRecord)
      .filter(filterUnnotifiedEvents)
      .map(transformEvent);

    for (const command of transformedCommands) {
      await sqsRepository.send(commandsQueueUrl, command);
    }
  }
