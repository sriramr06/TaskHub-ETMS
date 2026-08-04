import { z } from 'zod';

/**
 * Native `<select>` elements always submit a string, even for a blank
 * placeholder option (`value=""`). Wrap an optional enum/number schema with
 * this so a left-alone placeholder resolves to `undefined` instead of
 * failing validation against `""`.
 */
export const optionalSelect = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema.optional());
