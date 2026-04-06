import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Users } from "lucide-react";
import { format } from "date-fns";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useListGroups,
  getListGroupsQueryKey,
  useGetUserBalances,
  getGetUserBalancesQueryKey,
} from "@workspace/api-client-react";

export default function Groups() {
  const user = useActiveUser();

  const { data: groups, isLoading: isLoadingGroups } = useListGroups({
    query: { queryKey: getListGroupsQueryKey() }
  });

  const { data: balances, isLoading: isLoadingBalances } = useGetUserBalances(
    { userId: user.id },
    { query: { queryKey: getGetUserBalancesQueryKey({ userId: user.id }) } }
  );

  return (
    <Layout title="Groups" showBack actions={
      <Button variant="ghost" size="icon" asChild className="active:scale-95 transition-transform rounded-full">
        <Link href="/groups/new">
          <Plus className="h-4 w-4" />
        </Link>
      </Button>
    }>
      <div className="space-y-4 pb-24">
        {isLoadingGroups || isLoadingBalances ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : groups?.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed rounded-xl border-border/50">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No groups yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Create a group to start splitting expenses with your friends, roommates, or travel buddies.
            </p>
            <Button asChild className="active:scale-95 rounded-full">
              <Link href="/groups/new">Create Group</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups?.map(group => {
              const groupBalances = balances?.filter(b => b.groupId === group.id) || [];
              const owedToYou = groupBalances.filter(b => b.direction === 'owed').reduce((acc, curr) => acc + curr.amount, 0);
              const youOwe = groupBalances.filter(b => b.direction === 'owe').reduce((acc, curr) => acc + curr.amount, 0);
              const netBalance = owedToYou - youOwe;

              return (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="active:scale-[0.98] transition-transform hover:border-primary/50 cursor-pointer bg-card/60 backdrop-blur overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 flex items-center gap-4">
                        <div className="text-4xl bg-muted h-14 w-14 rounded-2xl flex items-center justify-center">
                          {group.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{group.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {group.description || `Created ${format(new Date(group.createdAt), 'MMM yyyy')}`}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Balance</div>
                          <div className={`font-mono font-semibold ${netBalance > 0 ? "text-primary" : netBalance < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {netBalance > 0 ? '+' : netBalance < 0 ? '-' : ''}₹{Math.abs(netBalance).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 flex justify-center z-40 pointer-events-none">
        <Button asChild size="lg" className="rounded-full shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform pointer-events-auto px-6">
          <Link href="/groups/new">
            <Plus className="mr-2 h-5 w-5" /> New Group
          </Link>
        </Button>
      </div>
    </Layout>
  );
}
