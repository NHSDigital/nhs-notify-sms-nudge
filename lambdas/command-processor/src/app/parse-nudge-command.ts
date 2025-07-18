import { SQSRecord } from 'aws-lambda';
import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import { NudgeCommand } from 'domain/nudge-command';
import { $NudgeCommand } from 'app/nudge-command-validator';

export const parseSqsRecord = (
  sqsRecord: SQSRecord,
  logger: Logger,
): NudgeCommand => {
  logger.info('Parsing SQS Record', {
    messageId: sqsRecord.messageId,
  });

  const jsonParsed = JSON.parse(sqsRecord.body) as NudgeCommand;
  const zodParsed = $NudgeCommand.parse(jsonParsed);

  logger.info('Parsed SQS Record as Nudge Command Event', {
    messageId: sqsRecord.messageId,
    sourceEventId: zodParsed.sourceEventId,
  });

  return zodParsed;
};
