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

    // Add unique constraint on clerk_id (ignore if it already exists)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_clerk_id_unique UNIQUE (clerk_id);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    logger.info("Schema migration OK");
  } catch (err) {
    logger.warn({ err }, "Schema migration warning — continuing");
  }
}
