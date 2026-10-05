import { z } from "zod";

const cents = z.number().int().min(0).max(100_000);

export const rateCardSchema = z.object({
  instantQuotes: z.boolean(),
  minMiles: z.number().int().min(0).max(5000),
  maxMiles: z.number().int().min(1).max(5000),
  serviceStates: z.array(z.string().regex(/^[A-Z]{2}$/)).max(60),
  tiers: z
    .array(z.object({ fromMiles: z.number().int().min(0).max(5000), toMiles: z.number().int().min(0).max(5000), ratePerCuFtCents: z.number().int().min(1).max(100_000) }))
    .max(20),
  packingPerCuFtCents: cents,
  unpackingPerCuFtCents: cents,
  storagePerCuFtMonthCents: cents,
});

export type RateCardInput = z.infer<typeof rateCardSchema>;
