import { z } from "zod";

export const createTradeSchema = z.object({
  accountId: z.string().uuid(),
  tradeDate: z.coerce.date(),
  pair: z.string().trim().min(1).max(30),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number().finite(),
  exitPrice: z.number().finite().nullable().optional(),
  stopLoss: z.number().finite().nullable().optional(),
  takeProfit: z.number().finite().nullable().optional(),
  lotSize: z.number().finite().nonnegative().default(0),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]),
  pnl: z.number().finite().default(0),
  strategy: z.string().trim().max(100).nullable().optional(),
  session: z.string().trim().max(50).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  psychology: z.enum(["GREED", "FEAR", "NEUTRAL"]).default("NEUTRAL"),
  riskReward: z.number().finite().positive().nullable().optional()
});

export const tradeListQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  pair: z.string().trim().max(30).optional(),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).optional(),
  psychology: z.enum(["GREED", "FEAR", "NEUTRAL"]).optional()
});
