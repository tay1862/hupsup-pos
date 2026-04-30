/**
 * Database client (singleton). Uses node-postgres + Drizzle.
 *
 * In dev, reuses the connection across hot reloads via globalThis.
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgPool?: Pool;
  db?: NodePgDatabase<typeof schema>;
};

function getPool(): Pool {
  if (!globalForDb.pgPool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env and configure it.",
      );
    }
    globalForDb.pgPool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX ?? 10),
    });
  }
  return globalForDb.pgPool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getPool(), { schema });
  }
  return globalForDb.db;
}

export { schema };
export const db = getDb();
