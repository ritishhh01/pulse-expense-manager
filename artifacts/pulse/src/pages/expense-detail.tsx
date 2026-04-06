import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

import { Layout } from "@/components/layout";
import { ELI7Tooltip } from "@/components/eli7-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useGetExpense,
  getGetExpenseQueryKey,
  useDeleteExpense,
  getListExpensesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetUserBalancesQueryKey,
} from "@workspace/api-client-react";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-400",
  travel: "bg-blue-500/20 text-blue-400",
  entertainment: "bg-purple-500/20 text-purple-400",
  shopping: "bg-pink-500/20 text-pink-400",
  utilities: "bg-yellow-500/20 text-yellow-400",
  health: "bg-green-500/20 text-green-400",
  others: "bg-muted text-muted-foreground",
};

export default function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const expenseId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = useActiveUser();
  const queryClient = useQueryClient();

  const { data: expense, isLoading } = useGetExpense(expenseId, {
    query: { enabled: !!expenseId, queryKey: getGetExpenseQueryKey(expenseId) },
  });

  const deleteExpense = useDeleteExpense();

  const isOwner = expense?.paidByUserId === user.id;

  function handleDelete() {
    if (!confirm("Delete this expense? This will remove all splits too.")) return;
    deleteExpense.mutate(
      {
        id: expenseId,
        data: { requestingUserId: user.id },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ groupId: expense?.groupId }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getGetUserBalancesQueryKey({ userId: user.id }) });
          toast({ title: "Expense deleted" });
          setLocation(expense?.groupId ? `/groups/${expense.groupId}` : "/");
        },
        onError: () => {
          toast({ title: "Failed to delete expense", variant: "destructive" });
        },
      }
    );
  }

  if (isLoading) {
    return (
      <Layout title="Loading..." showBack backHref="/groups">
        <div className="space-y-4 mt-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!expense) {
    return (
      <Layout title="Not Found" showBack backHref="/groups">
        <div className="text-center py-12 text-muted-foreground">Expense not found.</div>
      </Layout>
    );
  }

  const mySplit = expense.splits.find((s) => s.userId === user.id);

  return (
    <Layout
      title="Expense"
      showBack
      backHref={expense?.groupId ? `/groups/${expense.groupId}` : "/groups"}
      actions={
        isOwner ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
            onClick={handleDelete}
            disabled={deleteExpense.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null
      }
    >
      <div className="space-y-5 pb-24">
        {/* Main Card */}
        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-5">
              <Badge className={`${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.others}`} variant="secondary">
                {expense.category}
              </Badge>
              {isOwner && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                  Your expense
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-bold mb-2">{expense.description}</h2>
            <div className="text-4xl font-bold font-mono text-primary">₹{expense.amount.toFixed(2)}</div>

            <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Paid by</div>
                <div className="font-medium">
                  {expense.paidByUserName}
                  {expense.paidByUserId === user.id && <span className="text-primary text-xs ml-1">(you)</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Date</div>
                <div className="font-medium">{format(new Date(expense.createdAt), "MMM d, yyyy")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Group</div>
                <Link href={`/groups/${expense.groupId}`}>
                  <div className="font-medium text-primary underline-offset-2 hover:underline">{expense.groupName}</div>
                </Link>
              </div>
              {mySplit && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Your share</div>
                  <div className={`font-mono font-semibold ${mySplit.isPaid ? "text-primary" : "text-foreground"}`}>
                    ₹{mySplit.amount.toFixed(2)}
                    {mySplit.isPaid && <span className="text-xs ml-1">✓ paid</span>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Splits */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ELI7Tooltip term="Expense Split" explanation="Breaking one big bill into smaller pieces so everyone pays their fair share!" />
          </h3>
          <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
            {expense.splits.map((split) => (
              <div key={split.id} className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {split.userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {split.userName}
                    {split.userId === user.id && <span className="text-primary text-xs ml-1">(you)</span>}
                    {split.userId === expense.paidByUserId && <span className="text-muted-foreground text-xs ml-1">· paid</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-semibold text-sm ${split.isPaid ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    ₹{split.amount.toFixed(2)}
                  </span>
                  {split.isPaid && (
                    <span className="text-primary text-xs bg-primary/10 rounded-full px-2 py-0.5">settled</span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>

        {!isOwner && (
          <div className="text-xs text-center text-muted-foreground">
            Only the person who added this expense can delete it.
          </div>
        )}
      </div>
    </Layout>
  );
}
