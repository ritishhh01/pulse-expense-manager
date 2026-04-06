import { Router, type IRouter } from "express";
import { db, expensesTable, expenseSplitsTable, settlementsTable, groupsTable, groupMembersTable, usersTable } from "@workspace/db";
import { eq, and, sql, gte } from "drizzle-orm";
import {
  GetDashboardSummaryQueryParams,
  GetUserBalancesQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const params = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;

  const memberRows = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const groupCount = memberRows.length;

  const splitRows = await db
    .select({
      expenseId: expenseSplitsTable.expenseId,
      userId: expenseSplitsTable.userId,
      amount: expenseSplitsTable.amount,
      paidByUserId: expensesTable.paidByUserId,
    })
    .from(expenseSplitsTable)
    .leftJoin(expensesTable, eq(expenseSplitsTable.expenseId, expensesTable.id));

  let totalOwed = 0;
  let totalOwe = 0;

  for (const row of splitRows) {
    const amount = parseFloat(row.amount as string);
    if (row.paidByUserId === userId && row.userId !== userId) {
      totalOwed += amount;
    }
    if (row.userId === userId && row.paidByUserId !== userId) {
      totalOwe += amount;
    }
  }

  const settlementRows = await db
    .select({ amount: settlementsTable.amount, fromUserId: settlementsTable.fromUserId, toUserId: settlementsTable.toUserId })
    .from(settlementsTable)
    .where(gte(settlementsTable.settledAt, sql`NOW() - INTERVAL '30 days'`));

  let settledThisMonth = 0;
  for (const s of settlementRows) {
    if (s.fromUserId === userId || s.toUserId === userId) {
      settledThisMonth += parseFloat(s.amount as string);
    }
  }

  const recentExpenses = await db
    .select({ id: expensesTable.id })
    .from(expensesTable)
    .where(gte(expensesTable.createdAt, sql`NOW() - INTERVAL '30 days'`));

  res.json({
    totalOwed,
    totalOwe,
    netBalance: totalOwed - totalOwe,
    groupCount,
    recentExpenseCount: recentExpenses.length,
    settledThisMonth,
  });
});

router.get("/dashboard/balances", async (req, res): Promise<void> => {
  const params = GetUserBalancesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;

  const memberRows = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.userId, userId));

  const groupIds = memberRows.map((r) => r.groupId);
  const balanceMap: Map<string, { groupId: number; groupName: string; groupEmoji: string; withUserId: number; withUserName: string; withUserUpiId: string | null; amount: number }> = new Map();

  for (const { groupId } of memberRows) {
    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId));
    if (!group) continue;

    const expenses = await db
      .select({
        id: expensesTable.id,
        paidByUserId: expensesTable.paidByUserId,
        amount: expensesTable.amount,
      })
      .from(expensesTable)
      .where(eq(expensesTable.groupId, groupId));

    for (const expense of expenses) {
      const splits = await db
        .select()
        .from(expenseSplitsTable)
        .where(eq(expenseSplitsTable.expenseId, expense.id));

      for (const split of splits) {
        const splitAmount = parseFloat(split.amount as string);
        if (expense.paidByUserId === userId && split.userId !== userId) {
          const key = `${groupId}-${split.userId}`;
          const existing = balanceMap.get(key);
          if (existing) {
            existing.amount += splitAmount;
          } else {
            const [withUser] = await db.select().from(usersTable).where(eq(usersTable.id, split.userId));
            balanceMap.set(key, {
              groupId,
              groupName: group.name,
              groupEmoji: group.emoji,
              withUserId: split.userId,
              withUserName: withUser?.name ?? "",
              withUserUpiId: withUser?.upiId ?? null,
              amount: splitAmount,
            });
          }
        } else if (split.userId === userId && expense.paidByUserId !== userId) {
          const key = `${groupId}-${expense.paidByUserId}-owe`;
          const existing = balanceMap.get(key);
          if (existing) {
            existing.amount += splitAmount;
          } else {
            const [withUser] = await db.select().from(usersTable).where(eq(usersTable.id, expense.paidByUserId));
            balanceMap.set(key, {
              groupId,
              groupName: group.name,
              groupEmoji: group.emoji,
              withUserId: expense.paidByUserId,
              withUserName: withUser?.name ?? "",
              withUserUpiId: withUser?.upiId ?? null,
              amount: -splitAmount,
            });
          }
        }
      }
    }
  }

  const settlements = await db.select().from(settlementsTable);
  for (const s of settlements) {
    if (s.fromUserId === userId) {
      const key = `${s.groupId}-${s.toUserId}`;
      const existing = balanceMap.get(key);
      if (existing) {
        existing.amount -= parseFloat(s.amount as string);
      }
    } else if (s.toUserId === userId) {
      const key = `${s.groupId}-${s.fromUserId}-owe`;
      const existing = balanceMap.get(key);
      if (existing) {
        existing.amount += parseFloat(s.amount as string);
      }
    }
  }

  const balances = Array.from(balanceMap.values())
    .filter((b) => Math.abs(b.amount) > 0.01)
    .map((b) => ({
      ...b,
      direction: b.amount > 0 ? "owed" : "owe",
      amount: Math.abs(b.amount),
    }));

  res.json(balances);
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const params = GetRecentActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { userId } = params.data;

  const recentExpenses = await db
    .select({
      id: expensesTable.id,
      description: expensesTable.description,
      amount: expensesTable.amount,
      paidByUserId: expensesTable.paidByUserId,
      groupId: expensesTable.groupId,
      createdAt: expensesTable.createdAt,
      groupName: groupsTable.name,
      actorName: usersTable.name,
    })
    .from(expensesTable)
    .leftJoin(groupsTable, eq(expensesTable.groupId, groupsTable.id))
    .leftJoin(usersTable, eq(expensesTable.paidByUserId, usersTable.id))
    .orderBy(sql`${expensesTable.createdAt} DESC`)
    .limit(20);

  const recentSettlements = await db
    .select({
      id: settlementsTable.id,
      amount: settlementsTable.amount,
      fromUserId: settlementsTable.fromUserId,
      toUserId: settlementsTable.toUserId,
      groupId: settlementsTable.groupId,
      settledAt: settlementsTable.settledAt,
      groupName: groupsTable.name,
    })
    .from(settlementsTable)
    .leftJoin(groupsTable, eq(settlementsTable.groupId, groupsTable.id))
    .orderBy(sql`${settlementsTable.settledAt} DESC`)
    .limit(10);

  const activityItems: Array<{
    id: string;
    type: "expense_added" | "settlement_done" | "group_joined";
    description: string;
    amount: number | null;
    groupName: string;
    actorName: string;
    createdAt: Date;
  }> = [];

  for (const e of recentExpenses) {
    activityItems.push({
      id: `expense-${e.id}`,
      type: "expense_added",
      description: `${e.actorName ?? "Someone"} added "${e.description}"`,
      amount: parseFloat(e.amount as string),
      groupName: e.groupName ?? "",
      actorName: e.actorName ?? "",
      createdAt: e.createdAt,
    });
  }

  for (const s of recentSettlements) {
    const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, s.fromUserId));
    const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, s.toUserId));
    activityItems.push({
      id: `settlement-${s.id}`,
      type: "settlement_done",
      description: `${fromUser?.name ?? "Someone"} settled with ${toUser?.name ?? "someone"}`,
      amount: parseFloat(s.amount as string),
      groupName: s.groupName ?? "",
      actorName: fromUser?.name ?? "",
      createdAt: s.settledAt,
    });
  }

  activityItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(activityItems.slice(0, 20));
});

export default router;
