import { z } from 'zod';


const eventSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  specversion: z.string(),
  type: z.string(),
  plane: z.enum(["data", "control"]),
  subject: z.string().uuid(),
  time: z.string().datetime(),
  datacontenttype: z.string(),
  dataschema: z.string(),
  dataschemaversion: z.string(),
  data: z.custom(),
});

const unnotifiedEventSchema = z.object({
  nhsNumber: z.string(),
  delayedFallback: z.boolean(),
  sendingGroupId: z.string(),
  clientId: z.string(),
  campaignId: z.string(),
  supplierStatus: z.enum(["unnotified"]),
  billingReference: z.string(),
  previousSupplierStatus: z.string(),
  requestItemId: z.string(),
  requestItemPlanId: z.string(),
});
