import { db, usersTable, groupsTable, groupMembersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

const SEED_USERS = [
  { name: "Aryan Mehta", email: "aryan@example.com", upiId: "aryan@upi" },
  { name: "Priya Sharma", email: "priya@example.com", upiId: "priya@upi" },
  { name: "Karan Singh", email: "karan@example.com", upiId: "karan@upi" },
  { name: "Dia Kapoor", email: "dia@example.com", upiId: "dia@upi" },
];

export async function ensureSeedData(): Promise<void> {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    if (count > 0) {
      logger.info({ userCount: count }, "Seed data already present — skipping");
      return;
    }

    logger.info("No users found — seeding initial data");

    const insertedUsers = await db
      .insert(usersTable)
      .values(SEED_USERS)
      .returning();

    logger.info({ users: insertedUsers.map((u) => u.name) }, "Seeded users");
  } catch (err) {
    logger.warn({ err }, "Could not seed data — continuing anyway");
  }
}
