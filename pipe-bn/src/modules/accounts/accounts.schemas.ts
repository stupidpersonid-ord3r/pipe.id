import { z } from "zod";

export const accountTypeSchema = z.enum(["LIVE", "DEMO"]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  accountType: accountTypeSchema.default("LIVE"),
  startingBalance: z.number().finite().nonnegative().default(0),
  currency: z.string().trim().length(3).toUpperCase().default("USD"),
  pair: z.string().trim().max(30).nullable().optional()
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  pair: z.string().trim().max(30).nullable().optional()
});
