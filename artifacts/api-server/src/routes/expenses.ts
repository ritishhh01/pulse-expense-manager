import { Router, type IRouter } from "express";
import { db, expensesTable, expenseSplitsTable, groupsTable, groupMembersTable, usersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { getDbUserByClerkId } from "../lib/get-db-user";
import {
  ListExpensesQueryParams,
  CreateExpenseBody,
  GetExpenseParams,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  DeleteExpenseBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildExpenseWithSplits(expenseId: number) {
  const [expense] = await db
    .select({
      id: expensesTable.id,
      groupId: expensesTable.groupId,
      description: expensesTable.description,
      amount: expensesTable.amount,
      category: expensesTable.category,
      paidByUserId: expensesTable.paidByUserId,
      createdAt: expensesTable.createdAt,
      groupName: groupsTable.name,
      paidByUserName: usersTable.name,
    })
    .from(expensesTable)
    .leftJoin(groupsTable, eq(expensesTable.groupId, groupsTable.id))
    .leftJoin(usersTable, eq(expensesTable.paidByUserId, usersTable.id))
    .where(eq(expensesTable.id, expenseId));

  if (!expense) return null;

  const rawSplits = await db
    .select({
      id: expenseSplitsTable.id,
      expenseId: expenseSplitsTable.expenseId,
      userId: expenseSplitsTable.userId,
      amount: expenseSplitsTable.amount,
      isPaid: expenseSplitsTable.isPaid,
      userName: usersTable.name,
    })
    .from(expenseSplitsTable)
    .leftJoin(usersTable, eq(expenseSplitsTable.userId, usersTable.id))
    .where(eq(expenseSplitsTable.expenseId, expenseId));

  return {
    ...expense,
    groupName: expense.groupName ?? "",
    paidByUserName: expense.paidByUserName ?? "",
    amount: parseFloat(expense.amount as string),
    splits: rawSplits.map((s) => ({
      ...s,
      userName: s.userName ?? "",
      amount: parseFloat(s.amount as string),
      isPaid: s.isPaid === "true",
    })),
  };
}

router.get("/expenses", async (req, res): Promise<void> => {
  const params = ListExpensesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const dbUser = await getDbUserByClerkId(clerkId);
  if (!dbUser) { res.status(401).json({ error: "User not found" }); return; }

  const memberRows = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, dbUser.id));

  const userGroupIds = memberRows.map((r) => r.groupId);

  if (userGroupIds.length === 0) {
    res.json([]);
    return;
  }

  let query = db
    .select({
      id: expensesTable.id,
      groupId: expensesTable.groupId,
      description: expensesTable.description,
      amount: expensesTable.amount,
      category: expensesTable.category,
      paidByUserId: expensesTable.paidByUserId,
      createdAt: expensesTable.createdAt,
      groupName: groupsTable.name,
      paidByUserName: usersTable.name,
    })
    .from(expensesTable)
    .leftJoin(groupsTable, eq(expensesTable.groupId, groupsTable.id))
    .leftJoin(usersTable, eq(expensesTable.paidByUserId, usersTable.id));

  const rows = params.data.groupId
    ? await query.where(and(eq(expensesTable.groupId, params.data.groupId), inArray(expensesTable.groupId, userGroupIds)))
    : await query.where(inArray(expensesTable.groupId, userGroupIds));

  const expenses = await Promise.all(
    rows.map(async (e) => {
      const splits = await db
        .select({
          id: expenseSplitsTable.id,
          expenseId: expenseSplitsTable.expenseId,
          userId: expenseSplitsTable.userId,
          amount: expenseSplitsTable.amount,
          isPaid: expenseSplitsTable.isPaid,
          userName: usersTable.name,
        })
        .from(expenseSplitsTable)
        .leftJoin(usersTable, eq(expenseSplitsTable.userId, usersTable.id))
        .where(eq(expenseSplitsTable.expenseId, e.id));

      return {
        ...e,
        groupName: e.groupName ?? "",
        paidByUserName: e.paidByUserName ?? "",
        amount: parseFloat(e.amount as string),
        splits: splits.map((s) => ({
          ...s,
          userName: s.userName ?? "",
          amount: parseFloat(s.amount as string),
          isPaid: s.isPaid === "true",
        })),
      };
    })
  );

  res.json(expenses);
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { splits, ...expenseData } = parsed.data;

  const [expense] = await db
    .insert(expensesTable)
    .values({ ...expenseData, amount: String(expenseData.amount) })
    .returning();

  await db.insert(expenseSplitsTable).values(
    splits.map((s) => ({
      expenseId: expense.id,
      userId: s.userId,
      amount: String(s.amount),
    }))
  );

  const result = await buildExpenseWithSplits(expense.id);
  res.status(201).json(result);
});

router.get("/expenses/:id", async (req, res): Promise<void> => {
  const params = GetExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await buildExpenseWithSplits(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json(result);
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateExpenseBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  if (existing.paidByUserId !== body.data.requestingUserId) {
    res.status(403).json({ error: "Only the expense owner can edit this" });
    return;
  }

  const { requestingUserId, ...updateFields } = body.data;
  const updateData: Record<string, unknown> = {};
  if (updateFields.description != null) updateData.description = updateFields.description;
  if (updateFields.amount != null) updateData.amount = String(updateFields.amount);
  if (updateFields.category != null) updateData.category = updateFields.category;

  await db.update(expensesTable).set(updateData).where(eq(expensesTable.id, params.data.id));

  const result = await buildExpenseWithSplits(params.data.id);
  res.json(result);
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = DeleteExpenseBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(expensesTable).where(eq(expensesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  if (existing.paidByUserId !== body.data.requestingUserId) {
    res.status(403).json({ error: "Only the expense owner can delete this" });
    return;
  }

  await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
