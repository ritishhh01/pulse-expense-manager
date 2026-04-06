import { Router, type IRouter } from "express";
import { db, groupsTable, groupMembersTable, usersTable, expensesTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  CreateGroupBody,
  GetGroupParams,
  UpdateGroupParams,
  UpdateGroupBody,
  DeleteGroupParams,
  AddGroupMemberParams,
  AddGroupMemberBody,
  ListGroupsResponse,
  GetGroupResponse,
  UpdateGroupResponse,
} from "@workspace/api-zod";
import { getDbUserByClerkId } from "../lib/get-db-user";

const router: IRouter = Router();

router.get("/groups", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const dbUser = await getDbUserByClerkId(clerkId);
  if (!dbUser) { res.status(401).json({ error: "User not found" }); return; }

  const memberRows = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, dbUser.id));

  if (memberRows.length === 0) {
    res.json([]);
    return;
  }

  const groupIds = memberRows.map((r) => r.groupId);
  const groups = await db
    .select()
    .from(groupsTable)
    .where(inArray(groupsTable.id, groupIds))
    .orderBy(groupsTable.createdAt);

  res.json(ListGroupsResponse.parse(groups));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { memberUserIds, type, ...groupData } = parsed.data;

  const [group] = await db.insert(groupsTable).values({ ...groupData, type: type ?? "other" }).returning();

  const memberIds = [groupData.createdByUserId, ...(memberUserIds ?? [])];
  const uniqueMemberIds = [...new Set(memberIds)];

  await db.insert(groupMembersTable).values(
    uniqueMemberIds.map((userId) => ({ groupId: group.id, userId }))
  );

  res.status(201).json(group);
});

router.get("/groups/:id", async (req, res): Promise<void> => {
  const params = GetGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, params.data.id));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const memberRows = await db
    .select({ userId: groupMembersTable.userId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, group.id));

  const memberUserIds = memberRows.map((r) => r.userId);
  const members = memberUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, memberUserIds))
    : [];

  const expenseStats = await db
    .select({
      totalExpenses: sql<string>`COALESCE(SUM(${expensesTable.amount}), 0)`,
      expenseCount: sql<number>`COUNT(*)::int`,
    })
    .from(expensesTable)
    .where(eq(expensesTable.groupId, group.id));

  const detail = {
    ...group,
    members,
    totalExpenses: parseFloat(expenseStats[0]?.totalExpenses ?? "0"),
    expenseCount: expenseStats[0]?.expenseCount ?? 0,
  };

  res.json(GetGroupResponse.parse(detail));
});

router.patch("/groups/:id", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [group] = await db
    .update(groupsTable)
    .set(body.data)
    .where(eq(groupsTable.id, params.data.id))
    .returning();

  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  res.json(UpdateGroupResponse.parse(group));
});

router.delete("/groups/:id", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [group] = await db.delete(groupsTable).where(eq(groupsTable.id, params.data.id)).returning();
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  res.sendStatus(204);
});

router.delete("/groups/:id/members/:userId", async (req, res): Promise<void> => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const dbUser = await getDbUserByClerkId(clerkId);
  if (!dbUser) { res.status(401).json({ error: "User not found" }); return; }

  const groupId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);
  if (isNaN(groupId) || isNaN(targetUserId)) {
    res.status(400).json({ error: "Invalid IDs" });
    return;
  }

  const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId));
  if (!group) { res.status(404).json({ error: "Group not found" }); return; }

  const isSelf = targetUserId === dbUser.id;
  const isCreator = group.createdByUserId === dbUser.id;

  if (!isSelf && !isCreator) {
    res.status(403).json({ error: "Only the group creator can remove other members" });
    return;
  }

  await db.delete(groupMembersTable).where(
    sql`group_id = ${groupId} AND user_id = ${targetUserId}`
  );

  res.sendStatus(204);
});

router.post("/groups/:id/members", async (req, res): Promise<void> => {
  const params = AddGroupMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddGroupMemberBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(groupMembersTable)
    .where(
      eq(groupMembersTable.groupId, params.data.id)
    );

  const [member] = await db
    .insert(groupMembersTable)
    .values({ groupId: params.data.id, userId: body.data.userId })
    .returning();

  res.status(201).json(member);
});

export default router;
