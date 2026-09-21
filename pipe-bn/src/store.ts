import { randomUUID } from "node:crypto";
import type {
  AccountRecord,
  AccountTransactionRecord,
  ProfileRecord,
  TradeRecord,
  UserRecord,
} from "./types.js";

export const users = new Map<string, UserRecord>();
export const profiles = new Map<string, ProfileRecord>();
export const accounts = new Map<string, AccountRecord>();
export const accountTransactions = new Map<string, AccountTransactionRecord>();
export const trades = new Map<string, TradeRecord>();

export function now() {
  return new Date().toISOString();
}

export function createId() {
  return randomUUID();
}

export function seedDevData() {
  if (users.size > 0) return;

  // Deliberately no demo user is created here. Registration is the first step.
}

seedDevData();
