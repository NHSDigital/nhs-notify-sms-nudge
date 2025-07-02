import { SupplierStatusChangeEvent } from "../domain/cloud-event";
import { NudgeCommand } from "../domain/nudge-command";

export const transformEvent = (event: SupplierStatusChangeEvent): NudgeCommand => {

  return { ...event.data };
}
