import { SQSRecord } from 'aws-lambda';
import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import { NudgeCommand } from 'domain/nudge-command';
import { $NudgeCommand } from 'app/nudge-command-validator';

export const parseSqsRecord = (
  sqsRecord: SQSRecord,
  logger: Logger,
): NudgeCommand => {
  logger.info('Parsing SQS Record, messageID: %s', sqsRecord.messageId);
  try {
    const jsonParsed = JSON.parse(sqsRecord.body) as NudgeCommand;
    const zodParsed = $NudgeCommand.parse(jsonParsed);

    logger.info(
      'SQS Record (%s) parsed as Nudge Command Event',
      sqsRecord.messageId,
    );

    return zodParsed;
  } catch (error) {
    logger.error('Failed to parse Nudge Command Event', error);
    throw error;
  }
};
