import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Plus, Users, Receipt, ArrowLeft, Trash2, UserPlus } from "lucide-react";
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
  useGetGroup,
  getGetGroupQueryKey,
  useListExpenses,
  getListExpensesQueryKey,
  useGetUserBalances,
  getGetUserBalancesQueryKey,
  useDeleteGroup,
  getListGroupsQueryKey,
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

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const groupId = parseInt(id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = useActiveUser();
  const queryClient = useQueryClient();

  const { data: group, isLoading: isLoadingGroup } = useGetGroup(groupId, {
    query: { enabled: !!groupId, queryKey: getGetGroupQueryKey(groupId) },
  });

  const { data: expenses, isLoading: isLoadingExpenses } = useListExpenses(
    { groupId },
    { query: { queryKey: getListExpensesQueryKey({ groupId }) } }
  );

  const { data: balances } = useGetUserBalances(
    { userId: user.id },
    { query: { queryKey: getGetUserBalancesQueryKey({ userId: user.id }) } }
  );

  const deleteGroup = useDeleteGroup();

  const groupBalances = balances?.filter((b) => b.groupId === groupId) || [];
  const owedToYou = groupBalances.filter((b) => b.direction === "owed").reduce((a, c) => a + c.amount, 0);
  const youOwe = groupBalances.filter((b) => b.direction === "owe").reduce((a, c) => a + c.amount, 0);
  const netBalance = owedToYou - youOwe;

  function handleDeleteGroup() {
    if (!confirm("Delete this group? This will remove all expenses.")) return;
    deleteGroup.mutate(
      { id: groupId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
          toast({ title: "Group deleted" });
          setLocation("/groups");
        },
        onError: () => {
          toast({ title: "Failed to delete group", variant: "destructive" });
        },
      }
    );
  }

  if (isLoadingGroup) {
    return (
      <Layout title="Loading..." showBack backHref="/groups">
        <div className="space-y-4 mt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout title="Not Found" showBack backHref="/groups">
        <div className="text-center py-12 text-muted-foreground">Group not found.</div>
      </Layout>
    );
  }

  return (
    <Layout
      title={group.name}
      showBack
      backHref="/groups"
      actions={
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
          onClick={handleDeleteGroup}
          disabled={deleteGroup.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-5 pb-32">
        {/* Group Hero Card */}
        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl bg-muted/50 h-16 w-16 rounded-2xl flex items-center justify-center">
                {group.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold">{group.name}</h2>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {group.members.length} members
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    {group.expenseCount} expenses
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 pt-4 border-t border-border/30">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">
                  <ELI7Tooltip term="Total Spent" explanation="All the money spent in this group by everyone combined!" />
                </div>
                <div className="font-mono font-semibold text-base">₹{group.totalExpenses.toFixed(2)}</div>
              </div>
              <div className="text-center border-x border-border/30">
                <div className="text-xs text-muted-foreground mb-1">You're Owed</div>
                <div className="font-mono font-semibold text-base text-primary">₹{owedToYou.toFixed(2)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">You Owe</div>
                <div className="font-mono font-semibold text-base text-destructive">₹{youOwe.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</h3>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-card/60 rounded-full px-3 py-1.5 border border-border/50"
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
                {member.id === user.id && (
                  <span className="text-[10px] text-primary font-mono">you</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        {groupBalances.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ELI7Tooltip term="Group Balance" explanation="This is how much money is floating around your friend group — like everyone's tab at a restaurant!" />
            </h3>
            <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
              {groupBalances.map((b, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                      {b.withUserName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{b.withUserName}</div>
                      <div className={`text-xs ${b.direction === "owed" ? "text-primary" : "text-destructive"}`}>
                        {b.direction === "owed" ? "owes you" : "you owe"}
                      </div>
                    </div>
                  </div>
                  <div className={`font-mono font-semibold ${b.direction === "owed" ? "text-primary" : "text-destructive"}`}>
                    ₹{b.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Expenses */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expenses</h3>
          {isLoadingExpenses ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : expenses?.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
              No expenses yet. Add one!
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
              {expenses?.map((expense) => (
                <Link key={expense.id} href={`/expenses/${expense.id}`}>
                  <div className="p-4 flex items-center gap-3 active:bg-muted/30 transition-colors cursor-pointer">
                    <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.others}`} variant="secondary">
                      {expense.category}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{expense.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Paid by {expense.paidByUserName} · {format(new Date(expense.createdAt), "MMM d")}
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-sm shrink-0">₹{expense.amount.toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 left-0 lg:left-60 right-0 p-4 flex justify-center gap-3 z-40 pointer-events-none lg:bottom-6">
        <div className="container max-w-lg mx-auto flex justify-center gap-3 pointer-events-auto">
          <Button
            asChild
            size="lg"
            className="rounded-full shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform px-6"
          >
            <Link href={`/expenses/new?groupId=${groupId}`}>
              <Plus className="mr-2 h-5 w-5" /> Add Expense
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="rounded-full shadow-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-transform px-6"
          >
            <Link href={`/settle?groupId=${groupId}`}>
              <ELI7Tooltip term="Settle Up" explanation="Click this to tell your friend 'Hey, give me my candy money back!' so everyone is even." />
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
