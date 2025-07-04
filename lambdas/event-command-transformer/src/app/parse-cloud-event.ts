import { SQSRecord } from "aws-lambda";
import { SupplierStatusChangeEvent } from "../domain/cloud-event";

export const parseSqsRecord = (sqsRecord: SQSRecord): SupplierStatusChangeEvent =>
  JSON.parse(sqsRecord.body) as SupplierStatusChangeEvent;
