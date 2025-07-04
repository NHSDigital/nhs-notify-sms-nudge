export type IncomingQueueMessage = {
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
