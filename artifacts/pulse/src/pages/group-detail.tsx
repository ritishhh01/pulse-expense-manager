import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Plus, Users, Receipt, Trash2, UserPlus, X, Check, Search, LogOut, UserX } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import { Layout } from "@/components/layout";
import { ELI7Tooltip } from "@/components/eli7-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useListUsers,
  getListUsersQueryKey,
  useAddGroupMember,
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
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  const { data: allUsers } = useListUsers({
    query: { queryKey: getListUsersQueryKey(), enabled: addMemberOpen },
  });

  const deleteGroup = useDeleteGroup();
  const addMember = useAddGroupMember();

  const groupBalances = balances?.filter((b) => b.groupId === groupId) || [];
  const owedToYou = groupBalances.filter((b) => b.direction === "owed").reduce((a, c) => a + c.amount, 0);
  const youOwe = groupBalances.filter((b) => b.direction === "owe").reduce((a, c) => a + c.amount, 0);

  const currentMemberIds = new Set(group?.members.map((m) => m.id) ?? []);
  const availableToAdd = allUsers?.filter((u) => !currentMemberIds.has(u.id)) ?? [];

  const filteredExpenses = useMemo(() => {
    if (!expenses || !search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.paidByUserName.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const isCreator = group?.createdByUserId === user.id;

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

  async function handleLeaveGroup() {
    if (!confirm("Leave this group?")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
      toast({ title: "Left group" });
      setLocation("/groups");
    } catch {
      toast({ title: "Failed to leave group", variant: "destructive" });
    }
  }

  async function handleRemoveMember(memberId: number, memberName: string) {
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    setRemovingUserId(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) });
      toast({ title: `${memberName} removed` });
    } catch {
      toast({ title: "Failed to remove member", variant: "destructive" });
    } finally {
      setRemovingUserId(null);
    }
  }

  function handleAddMember(userId: number, userName: string) {
    setAddingUserId(userId);
    addMember.mutate(
      { id: groupId, data: { userId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) });
          toast({ title: `${userName} added to group!` });
          setAddingUserId(null);
        },
        onError: () => {
          toast({ title: "Failed to add member", variant: "destructive" });
          setAddingUserId(null);
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
        <div className="flex items-center gap-1">
          {!isCreator && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-transform"
              onClick={handleLeaveGroup}
              title="Leave group"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
          {isCreator && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending}
              title="Delete group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pb-32">
        {/* Group Hero Card */}
        <Card className="bg-gradient-to-br from-card via-card/80 to-card/50 border-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl bg-muted/50 h-16 w-16 rounded-2xl flex items-center justify-center shrink-0">
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full text-xs gap-1.5 text-primary hover:bg-primary/10 px-3"
              onClick={() => setAddMemberOpen(true)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-card/60 rounded-full px-3 py-1.5 border border-border/50"
              >
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
                {member.id === user.id && (
                  <span className="text-[10px] text-primary font-mono">you</span>
                )}
                {isCreator && member.id !== user.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    disabled={removingUserId === member.id}
                    className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                  >
                    {removingUserId === member.id ? (
                      <div className="h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
                    ) : (
                      <UserX className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        {groupBalances.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <ELI7Tooltip
                term="Group Balance"
                explanation="This is how much money is floating around your friend group — like everyone's tab at a restaurant!"
              />
            </h3>
            <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
              {groupBalances.map((b, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expenses</h3>
            {expenses && expenses.length > 3 && (
              <span className="text-xs text-muted-foreground">{filteredExpenses?.length ?? 0} of {expenses.length}</span>
            )}
          </div>

          {/* Search */}
          {expenses && expenses.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="pl-9 h-10 bg-card/50 border-border/50 text-sm focus-visible:ring-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {isLoadingExpenses ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filteredExpenses?.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
              {search ? `No expenses matching "${search}"` : "No expenses yet. Add one!"}
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
              {filteredExpenses?.map((expense) => (
                <Link key={expense.id} href={`/expenses/${expense.id}`}>
                  <div className="p-4 flex items-center gap-3 active:bg-muted/30 transition-colors cursor-pointer">
                    <Badge
                      className={`text-xs shrink-0 ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.others}`}
                      variant="secondary"
                    >
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
        <div className="flex justify-center gap-3 pointer-events-auto">
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
              Settle Up
            </Link>
          </Button>
        </div>
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addMemberOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setAddMemberOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
                <div>
                  <h2 className="font-semibold text-base">Add Member</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Add someone to <span className="font-medium text-foreground">{group.name}</span></p>
                </div>
                <button
                  onClick={() => setAddMemberOpen(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 max-h-72 overflow-y-auto">
                {availableToAdd.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    All users are already in this group!
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableToAdd.map((u) => {
                      const isAdding = addingUserId === u.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleAddMember(u.id, u.name)}
                          disabled={isAdding}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 active:scale-[0.98] transition-all text-left disabled:opacity-60"
                        >
                          <div
                            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ backgroundColor: u.avatarColor }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{u.name}</div>
                            {u.upiId && (
                              <div className="text-xs text-muted-foreground font-mono truncate">{u.upiId}</div>
                            )}
                          </div>
                          <div className="shrink-0">
                            {isAdding ? (
                              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Plus className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-muted-foreground"
                  onClick={() => setAddMemberOpen(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
}
