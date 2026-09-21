import { z } from "zod";

const gmailLowercase = z.string()
  .email()
  .regex(/^[a-z0-9._%+-]+@gmail\.com$/, "Email must be a lowercase Gmail address.");

export const registerSchema = z.object({
  email: gmailLowercase,
  password: z.string().length(8)
});

export const loginSchema = z.object({
  email: gmailLowercase,
  password: z.string().min(1)
});
