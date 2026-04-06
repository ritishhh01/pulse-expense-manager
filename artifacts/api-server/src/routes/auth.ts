import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const AVATAR_COLORS = [
  "#39FF14", "#00D4FF", "#FF6B35", "#B45DFF", "#FFD700",
  "#FF007F", "#00FFCC", "#FF4500", "#7DF9FF", "#ADFF2F",
];

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

router.post("/auth/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const clerkId = auth.userId;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (existing) {
    res.json(existing);
    return;
  }

  const clerkUser = await clerkClient.users.getUser(clerkId);

  const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null;
  const email =
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    `user_${clerkId.slice(-8)}@pulse.app`;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    (phone ? phone.replace(/\D/g, "").slice(-4).padStart(4, "0") : "User");

  const existing2 = phone
    ? (
        await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.phoneNumber, phone))
      )[0]
    : undefined;

  if (existing2) {
    const [linked] = await db
      .update(usersTable)
      .set({ clerkId, name: existing2.name || name })
      .where(eq(usersTable.id, existing2.id))
      .returning();
    res.json(linked);
    return;
  }

  let finalEmail = email;
  const emailConflict = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));
  if (emailConflict.length > 0) {
    finalEmail = `user_${clerkId.slice(-12)}@pulse.app`;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId,
      name,
      email: finalEmail,
      phoneNumber: phone ?? undefined,
      avatarColor: randomAvatarColor(),
    })
    .returning();

  res.status(201).json(created);
});

export default router;
