import { SqsRepository } from "@sms/util-aws";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { filterUnnotifiedEvents } from "../app/event-filters";
import { transformEvent } from "../app/event-transform";
import { SupplierStatusChangeEvent } from "../domain/cloud-event";
import { NudgeCommand } from "../domain/nudge-command";


export type TransformDependencies = {
  sqsRepository: SqsRepository;
  commandsQueueUrl: string;
};

export const createHandler = ({ sqsRepository, commandsQueueUrl }: TransformDependencies) =>
  async function handler(event: SQSEvent) {

    const transformedCommands: NudgeCommand[] = event.Records
      .map(parseSqsRecord)
      .filter(filterUnnotifiedEvents)
      .map(transformEvent);

    for (const command of transformedCommands) {
      await sqsRepository.send(commandsQueueUrl, command); // assuming processEvent is async
    }
  }

const parseSqsRecord = (sqsRecord: SQSRecord): SupplierStatusChangeEvent =>
  JSON.parse(sqsRecord.body) as SupplierStatusChangeEvent;
