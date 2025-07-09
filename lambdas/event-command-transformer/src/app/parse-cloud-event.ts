import { $SupplierStatusChange } from "app/supplier-status-change-validator";
import { SQSRecord } from "aws-lambda";
import { SupplierStatusChangeEvent } from "domain/cloud-event";
import { Logger } from "nhs-notify-sms-nudge-utils/logger";

export const parseSqsRecord = (
  sqsRecord: SQSRecord,
  logger: Logger,
): SupplierStatusChangeEvent => {
  logger.info("Parsing SQS Record, messageID: %s", sqsRecord.messageId);
  try {
    const jsonParsed = JSON.parse(sqsRecord.body) as SupplierStatusChangeEvent;
    const zodParsed = $SupplierStatusChange.parse(jsonParsed);

    logger.info(
      "SQS Record (%s) parsed as Supplier Status Change Event",
      sqsRecord.messageId,
    );

    return zodParsed;
  } catch (error) {
    logger.error("Failed to parse Cloud Event", error);
    throw error;
  }
};
