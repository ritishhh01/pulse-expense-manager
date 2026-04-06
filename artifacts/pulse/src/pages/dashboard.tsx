import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, ArrowRight, Activity, Wallet, Users, Receipt } from "lucide-react";
import { format } from "date-fns";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ELI7Tooltip } from "@/components/eli7-tooltip";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  useGetUserBalances,
  getGetUserBalancesQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  useListGroups,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";

export default function Dashboard() {
  const user = useActiveUser();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary(
    { userId: user.id },
    { query: { queryKey: getGetDashboardSummaryQueryKey({ userId: user.id }) } }
  );

  const { data: balances, isLoading: isLoadingBalances } = useGetUserBalances(
    { userId: user.id },
    { query: { queryKey: getGetUserBalancesQueryKey({ userId: user.id }) } }
  );

  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity(
    { userId: user.id },
    { query: { queryKey: getGetRecentActivityQueryKey({ userId: user.id }) } }
  );

  const { data: groups, isLoading: isLoadingGroups } = useListGroups({
    query: { queryKey: getListGroupsQueryKey() }
  });

  return (
    <Layout
      title="Pulse"
      actions={
        <Button variant="ghost" size="icon" asChild className="active:scale-95 transition-transform rounded-full bg-primary/10 text-primary hover:bg-primary/20">
          <Link href="/activity">
            <Activity className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Top Summary Bento */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="col-span-2 bg-gradient-to-br from-card to-card/50 border-primary/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
              <Wallet className="h-24 w-24 -mr-4 -mt-4" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  <ELI7Tooltip term="Net Balance" explanation="How much you're owed minus how much you owe — if it's positive, people owe YOU money!" />
                </span>
              </div>
              {isLoadingSummary ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold tracking-tight ${summary?.netBalance && summary.netBalance > 0 ? "text-primary" : summary?.netBalance && summary.netBalance < 0 ? "text-destructive" : "text-foreground"}`}>
                    ₹{Math.abs(summary?.netBalance || 0).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground uppercase">
                    {summary?.netBalance && summary.netBalance >= 0 ? "owed to you" : "you owe"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <span className="text-xs font-medium text-muted-foreground mb-1">Total Owed</span>
              {isLoadingSummary ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <span className="text-lg font-bold text-primary">₹{(summary?.totalOwed || 0).toFixed(2)}</span>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardContent className="p-4 flex flex-col justify-center h-full">
              <span className="text-xs font-medium text-muted-foreground mb-1">Total Owe</span>
              {isLoadingSummary ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <span className="text-lg font-bold text-destructive">₹{(summary?.totalOwe || 0).toFixed(2)}</span>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Groups Bento Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Your Groups
            </h2>
            <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0 active:scale-95" asChild>
              <Link href="/groups">See all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoadingGroups ? (
              <>
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl hidden lg:block" />
              </>
            ) : groups?.length === 0 ? (
              <div className="col-span-2 text-center p-6 border border-dashed rounded-2xl text-muted-foreground text-sm">
                No groups yet. Time to create one!
              </div>
            ) : (
              groups?.slice(0, 4).map(group => {
                const groupBalance = balances?.find(b => b.groupId === group.id);
                return (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <Card className="h-full active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/50 group bg-card/60">
                      <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                        <div className="flex items-start justify-between">
                          <div className="text-2xl">{group.emoji}</div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{group.name}</h3>
                          <div className="text-xs font-medium mt-1">
                            {groupBalance ? (
                              <span className={groupBalance.direction === 'owed' ? "text-primary" : "text-destructive"}>
                                {groupBalance.direction === 'owed' ? '+' : '-'}₹{groupBalance.amount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Settled up</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
            
            <Link href="/groups/new">
              <Card className="h-full min-h-[8rem] flex items-center justify-center border-dashed border-muted-foreground/30 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary hover:bg-primary/5">
                <CardContent className="p-4 flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-xs font-medium">New Group</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3 pb-24">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Recent Pulse
          </h2>
          
          <Card className="bg-card/60 backdrop-blur">
            <CardContent className="p-0 divide-y divide-border/50">
              {isLoadingActivity ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))
              ) : activity?.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                activity?.slice(0, 5).map(item => (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${
                      item.type === 'expense_added' ? 'bg-primary/20 text-primary' :
                      item.type === 'settlement_done' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {item.actorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-semibold">{item.actorName}</span> {item.description}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="truncate max-w-[100px] inline-block">{item.groupName}</span>
                        <span>•</span>
                        <span>{format(new Date(item.createdAt), 'MMM d, h:mm a')}</span>
                      </p>
                    </div>
                    {item.amount && (
                      <div className="font-mono text-sm font-medium">
                        ₹{item.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 left-0 lg:left-60 right-0 p-4 flex justify-center gap-3 z-40 pointer-events-none lg:bottom-6">
        <div className="flex justify-center gap-3 pointer-events-auto">
          <Button asChild size="lg" className="rounded-full shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform px-6">
            <Link href="/expenses/new">
              <Plus className="mr-2 h-5 w-5" /> Add Expense
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="rounded-full shadow-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-transform px-6">
            <Link href="/settle">
              Settle Up
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
