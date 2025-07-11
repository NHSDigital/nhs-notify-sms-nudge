import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { z } from 'zod';

const schemaForType =
  <Output, Input = Output>() =>
  <S extends z.ZodType<Output, z.ZodTypeDef, Input>>(schema: S) =>
    schema;

export const $SupplierStatusChange = schemaForType<
  SupplierStatusChangeEvent,
  SupplierStatusChangeEvent
>()(
  z.object({
    id: z.string(),
    source: z.string(),
    specversion: z.string(),
    type: z.string(),
    plane: z.string(),
    subject: z.string(),
    time: z.string(),
    datacontenttype: z.string(),
    dataschema: z.string(),
    dataschemaversion: z.string(),
    data: z.object({
      nhsNumber: z.string(),
      delayedFallback: z.boolean().optional(),
      sendingGroupId: z.string(),
      clientId: z.string(),
      campaignId: z.string().optional(),
      supplierStatus: z.string(),
      billingReference: z.string().optional(),
      previousSupplierStatus: z.string().optional(),
      requestItemId: z.string(),
      requestItemPlanId: z.string(),
    }),
  }),
);
