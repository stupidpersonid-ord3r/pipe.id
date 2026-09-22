import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const envPath = path.join(root, ".env");

try {
  const envText = await fs.readFile(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // Fall back to the process environment when no root .env is present.
}

if (process.env.BN_RESET_CONFIRM !== "RESET_PIPE_BN_DATA") {
  console.error("Refusing to reset BN data. Set BN_RESET_CONFIRM=RESET_PIPE_BN_DATA explicitly.");
  process.exit(1);
}

const { dbRequired } = await import("../src/db/client.js");
const db = dbRequired();

try {
  await db.query("BEGIN");
  await db.query("DELETE FROM account_transactions");
  await db.query("DELETE FROM trades");
  await db.query("DELETE FROM accounts");
  await db.query("DELETE FROM refresh_sessions");
  await db.query("DELETE FROM password_reset_tokens");
  await db.query("DELETE FROM profiles");
  await db.query("DELETE FROM users");
  await db.query("COMMIT");
  console.log("PIPE.ID BN user/account/trade data reset. instrument_catalog was preserved.");
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
