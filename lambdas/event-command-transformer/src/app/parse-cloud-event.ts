import { SQSRecord } from "aws-lambda";
import { SupplierStatusChangeEvent } from "../domain/cloud-event";
import { $SupplierStatusChange } from "../domain/supplier-status-change-validator";

export const parseSqsRecord = (sqsRecord: SQSRecord): SupplierStatusChangeEvent => {

  return $SupplierStatusChange.parse(JSON.parse(sqsRecord.body) as SupplierStatusChangeEvent);
}
