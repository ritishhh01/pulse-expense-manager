import { Router, type IRouter } from "express";
import { db, settlementsTable, usersTable, groupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListSettlementsQueryParams,
  CreateSettlementBody,
  ListSettlementsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildUpiLink(upiId: string | null, name: string, amount: number): string | null {
  if (!upiId) return null;
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

router.get("/settlements", async (req, res): Promise<void> => {
  const params = ListSettlementsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let rows;
  if (params.data.groupId) {
    rows = await db
      .select({
        id: settlementsTable.id,
        groupId: settlementsTable.groupId,
        fromUserId: settlementsTable.fromUserId,
        toUserId: settlementsTable.toUserId,
        amount: settlementsTable.amount,
        settledAt: settlementsTable.settledAt,
      })
      .from(settlementsTable)
      .where(eq(settlementsTable.groupId, params.data.groupId));
  } else {
    rows = await db.select({
      id: settlementsTable.id,
      groupId: settlementsTable.groupId,
      fromUserId: settlementsTable.fromUserId,
      toUserId: settlementsTable.toUserId,
      amount: settlementsTable.amount,
      settledAt: settlementsTable.settledAt,
    }).from(settlementsTable);
  }

  const enriched = await Promise.all(
    rows.map(async (s) => {
      const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, s.fromUserId));
      const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, s.toUserId));
      return {
        ...s,
        amount: parseFloat(s.amount as string),
        fromUserName: fromUser?.name ?? "",
        toUserName: toUser?.name ?? "",
        toUserUpiId: toUser?.upiId ?? null,
        upiLink: buildUpiLink(toUser?.upiId ?? null, toUser?.name ?? "", parseFloat(s.amount as string)),
      };
    })
  );

  res.json(ListSettlementsResponse.parse(enriched));
});

router.post("/settlements", async (req, res): Promise<void> => {
  const parsed = CreateSettlementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [settlement] = await db
    .insert(settlementsTable)
    .values({ ...parsed.data, amount: String(parsed.data.amount) })
    .returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, settlement.fromUserId));
  const [toUser] = await db.select().from(usersTable).where(eq(usersTable.id, settlement.toUserId));

  const result = {
    ...settlement,
    amount: parseFloat(settlement.amount as string),
    fromUserName: fromUser?.name ?? "",
    toUserName: toUser?.name ?? "",
    toUserUpiId: toUser?.upiId ?? null,
    upiLink: buildUpiLink(toUser?.upiId ?? null, toUser?.name ?? "", parseFloat(settlement.amount as string)),
  };

  res.status(201).json(result);
});

export default router;
