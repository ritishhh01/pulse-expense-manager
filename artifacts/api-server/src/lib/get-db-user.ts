import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getDbUserByClerkId(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  return user ?? null;
}
