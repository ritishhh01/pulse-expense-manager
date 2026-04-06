import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { getDbUserByClerkId } from "../lib/get-db-user";
import {
  CreateUserBody,
  GetUserParams,
  ListUsersResponse,
  GetUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(ListUsersResponse.parse(users));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.insert(usersTable).values(parsed.data).returning();
  res.status(201).json(GetUserResponse.parse(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(user));
});

const PatchUserBody = z.object({
  name: z.string().min(1).optional(),
  upiId: z.string().nullish(),
  avatarColor: z.string().optional(),
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const dbUser = await getDbUserByClerkId(clerkId);
  if (!dbUser) { res.status(401).json({ error: "User not found" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id) || id !== dbUser.id) {
    res.status(403).json({ error: "Cannot update another user's profile" });
    return;
  }

  const parsed = PatchUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.upiId !== undefined) updates.upiId = parsed.data.upiId;
  if (parsed.data.avatarColor !== undefined) updates.avatarColor = parsed.data.avatarColor;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning();

  res.json(GetUserResponse.parse(updated));
});

export default router;
