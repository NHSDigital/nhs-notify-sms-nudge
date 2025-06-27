import { z } from 'zod';

/**
 * Acts as the inverse of z.infer
 * Allows us to keep control of our type system rather than having Zod define types for us
 * Will result in a type error if the given schema does not satisfy type T
 */
export const schemaForType =
  <Output, Input = Output>() =>
    <S extends z.ZodType<Output, z.ZodTypeDef, Input>>(schema: S) =>
      schema;
