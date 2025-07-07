import { SupplierStatusChangeEvent } from "../domain/cloud-event";

const expectedTypes = [
  "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
]

export const filterUnnotifiedEvents = (event: SupplierStatusChangeEvent): boolean => {

  if (!expectedTypes.includes(event.type)) {
    console.log(`Skipping event ${event.id}: Unexpected event type`);
    return false;
  }

  if (event.data.delayedFallback !== true) {
    console.log(`Skipping event ${event.id}: Not delayed fallback`);
    return false;
  }

  return true;
}
