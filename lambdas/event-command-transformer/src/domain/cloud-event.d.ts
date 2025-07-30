export type CloudEvent = {
  id: string;
  source: string;
  specversion: string;
  type: string;
  plane: string;
  subject: string;
  time: string; // ISO 8601 datetime string
  datacontenttype: string;
  dataschema: string;
  dataschemaversion: string;
};

export type SupplierStatusChangeEvent = CloudEvent & {
  data: {
    nhsNumber: string;
    delayedFallback?: boolean;
    sendingGroupId: string;
    clientId: string;
    campaignId?: string;
    supplierStatus: string;
    billingReference?: string;
    previousSupplierStatus?: string;
    requestItemId: string;
    requestItemPlanId: string;
  };
};

export type SupplierStatusBusEvent = {
  detail: SupplierStatusChangeEvent
};
