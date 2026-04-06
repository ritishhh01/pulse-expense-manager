import { Router, type IRouter } from "express";
import { db, groupsTable, groupMembersTable, usersTable, expensesTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
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

const router: IRouter = Router();

router.get("/groups", async (req, res): Promise<void> => {
  const groups = await db.select().from(groupsTable).orderBy(groupsTable.createdAt);
  res.json(ListGroupsResponse.parse(groups));
});

router.post("/groups", async (req, res): Promise<void> => {
  const parsed = CreateGroupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { memberUserIds, ...groupData } = parsed.data;

  const [group] = await db.insert(groupsTable).values(groupData).returning();

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
