import { z } from "zod";

export const gmailLowercase = z
  .string()
  .email()
  .regex(
    /^[a-z0-9._%+-]+@gmail\.com$/,
    "Email must be a lowercase Gmail address."
  );

export const passwordSchema = z
  .string()
  .length(8, "Password must be exactly 8 characters.")
  .refine(
    (v) => (v.match(/[a-z]/g) || []).length === 2,
    "Password must contain exactly 2 lowercase letters."
  )
  .refine(
    (v) => (v.match(/[A-Z]/g) || []).length === 2,
    "Password must contain exactly 2 uppercase letters."
  )
  .refine(
    (v) => (v.match(/[0-9]/g) || []).length === 2,
    "Password must contain exactly 2 digits."
  )
  .refine(
    (v) => (v.match(/[^A-Za-z0-9]/g) || []).length === 2,
    "Password must contain exactly 2 special characters."
  );

export const registerSchema = z.object({
  email: gmailLowercase,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: gmailLowercase,
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  traderName: z.string().trim().max(100).nullable().optional(),
  journalName: z.string().trim().max(100).nullable().optional(),
  theme: z.enum(["light", "dark"]).nullable().optional(),
  avatarUrl: z.union([z.string().url().max(2000), z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/).max(500000)]).nullable().optional(),
  backupEmail: gmailLowercase.nullable().optional(),
  phoneWhatsapp: z
    .string()
    .regex(/^\+[0-9]{6,15}$/)
    .nullable()
    .optional(),
});

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  accountType: z.enum(["LIVE", "DEMO"]).default("LIVE"),
  startingBalance: z.number().finite().nonnegative().default(0),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((v) => v.toUpperCase())
    .default("USD"),
  pair: z.string().trim().max(30).nullable().optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  pair: z.string().trim().max(30).nullable().optional(),
});

export const transactionSchema = z.object({
  amount: z.number().finite().positive(),
  note: z.string().trim().max(500).nullable().optional(),
});

const tradeResultPnlRule = (data: any, ctx: any) => {
  const { result, pnl } = data;

  if (result === undefined || pnl === undefined) return;

  if (result === "WIN" && !(pnl > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pnl"],
      message: "WIN trades require a positive PnL.",
    });
  }

  if (result === "LOSS" && !(pnl < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pnl"],
      message: "LOSS trades require a negative PnL.",
    });
  }

  if (result === "BREAKEVEN" && pnl !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pnl"],
      message: "BREAKEVEN trades require PnL to be 0.",
    });
  }
};

export const createTradeSchema = z
  .object({
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
    riskReward: z.number().finite().positive().nullable().optional(),
  })
  .superRefine(tradeResultPnlRule);

export const updateTradeSchema = z
  .object({
    tradeDate: z.coerce.date().optional(),
    pair: z.string().trim().min(1).max(30).optional(),
    direction: z.enum(["BUY", "SELL"]).optional(),
    entryPrice: z.number().finite().optional(),
    exitPrice: z.number().finite().nullable().optional(),
    stopLoss: z.number().finite().nullable().optional(),
    takeProfit: z.number().finite().nullable().optional(),
    lotSize: z.number().finite().nonnegative().optional(),
    result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).optional(),
    pnl: z.number().finite().optional(),
    strategy: z.string().trim().max(100).nullable().optional(),
    session: z.string().trim().max(50).nullable().optional(),
    notes: z.string().trim().max(5000).nullable().optional(),
    psychology: z.enum(["GREED", "FEAR", "NEUTRAL"]).optional(),
    riskReward: z.number().finite().positive().nullable().optional(),
  })
  .superRefine(tradeResultPnlRule);

export const tradeListQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  pair: z.string().trim().max(30).optional(),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).optional(),
  psychology: z.enum(["GREED", "FEAR", "NEUTRAL"]).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const changeEmailSchema = z.object({
  password: z.string().min(1),
  email: gmailLowercase,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: gmailLowercase,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});