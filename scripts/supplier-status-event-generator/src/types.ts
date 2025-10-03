export type SupplierStatusEvent = {
  version: string;
  id: string;
  'detail-type': 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1';
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  detail: SupplierStatusDetail;
};

type SupplierStatusDetail = {
  id: string;
  source: string;
  specversion: '1.0';
  type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1';
  plane: 'data';
  subject: string;
  time: string;
  datacontenttype: 'application/json';
  dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json';
  dataschemaversion: '1.0.0';
  data: SupplierStatusData;
};

type SupplierStatusData = {
  nhsNumber: string;
  delayedFallback: boolean;
  sendingGroupId: string;
  clientId: string;
  supplierStatus: 'unnotified';
  previousSupplierStatus: 'received';
  requestItemId: string;
  requestItemPlanId: string;
};
