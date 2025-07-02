import { SupplierStatusChangeEvent } from "../domain/cloud-event";

const expectedTypes = [
  "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
]

export const filterUnnotifiedEvents = (event: SupplierStatusChangeEvent): boolean => {

  return (event.type in expectedTypes)
    && event.data.delayedFallback === true;
}
