import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function dbQuery<T extends pg.QueryResultRow = any>(
  text: string,
  values: unknown[] = []
) {
  return pool.query<T>(text, values);
}
export function dbRequired() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  return pool;
}
