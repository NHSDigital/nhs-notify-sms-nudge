import { z } from 'zod';
import { NudgeCommand } from 'domain/nudge-command';

const schemaForType =
  <Output, Input = Output>() =>
  <S extends z.ZodType<Output, z.ZodTypeDef, Input>>(schema: S) =>
    schema;

export const $NudgeCommand = schemaForType<NudgeCommand, NudgeCommand>()(
  z.object({
    sourceEventId: z.string(),
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
);
