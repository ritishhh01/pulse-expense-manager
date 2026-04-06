import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Ensures required schema columns exist. Safe to run on every boot —
 * all operations are idempotent (IF NOT EXISTS / exception-safe).
 */
export async function ensureSchema(): Promise<void> {
  try {
    // Add columns that may be missing on older DBs (e.g. production)
    await db.execute(sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS clerk_id   text,
        ADD COLUMN IF NOT EXISTS phone_number text
    `);

    // Unique partial index on clerk_id — idempotent via IF NOT EXISTS
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_id_idx
        ON users (clerk_id) WHERE clerk_id IS NOT NULL
    `);

    logger.info("Schema migration OK");
  } catch (err) {
    logger.warn({ err }, "Schema migration warning — continuing");
  }
}
