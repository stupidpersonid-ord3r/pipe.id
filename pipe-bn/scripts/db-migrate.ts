import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");

// Load root .env before importing the database client.
const envPath = path.join(root, ".env");
const envText = await fs.readFile(envPath, "utf8");

for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) continue;

  const index = trimmed.indexOf("=");
  if (index === -1) continue;

  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

// IMPORTANT: import database client only after DATABASE_URL is loaded.
const { dbRequired } = await import("../src/db/client.js");

const sql = await fs.readFile(
  path.join(here, "..", "prisma", "migrations", "001_init.sql"),
  "utf8"
);

const db = dbRequired();

try {
  await db.query(sql);
  console.log("PIPE.ID PostgreSQL migration applied.");
} finally {
  await db.end();
}