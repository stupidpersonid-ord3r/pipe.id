try { process.loadEnvFile(); } catch {}
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  PASSWORD_RESET_URL: z.string().url().optional(),
  RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(30)
});

export const env = envSchema.parse(process.env);
export const corsOrigins = env.CORS_ORIGIN.split(",").map(v => v.trim()).filter(Boolean);
if (env.NODE_ENV === "production" && (!env.DATABASE_URL || !env.JWT_SECRET)) {
  throw new Error("Production requires DATABASE_URL and JWT_SECRET.");
}
