import { $SupplierStatusChange } from 'app/supplier-status-change-validator';
import { SQSRecord } from 'aws-lambda';
import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { Logger } from 'nhs-notify-sms-nudge-utils';

export const parseSqsRecord = (
  sqsRecord: SQSRecord,
  logger: Logger,
): SupplierStatusChangeEvent => {
  logger.info('Parsing SQS Record', {
    messageId: sqsRecord.messageId,
  });

  const jsonParsed = JSON.parse(sqsRecord.body) as SupplierStatusChangeEvent;
  const zodParsed = $SupplierStatusChange.parse(jsonParsed);

  logger.info('Parsed SQS Record as Supplier Status Change Event', {
    messageId: sqsRecord.messageId,
    cloudEventId: zodParsed.id,
    cloudEventType: zodParsed.type,
    cloudEventSpecVersion: zodParsed.specversion,
  });

  return zodParsed;
};
