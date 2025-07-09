import { SQSRecord } from "aws-lambda";
import { Logger } from "nhs-notify-sms-nudge-utils/logger";
import { $SupplierStatusChange } from "src/app/supplier-status-change-validator";
import { SupplierStatusChangeEvent } from "src/domain/cloud-event";

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
