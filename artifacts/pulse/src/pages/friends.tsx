import { useMemo } from "react";
import { Link } from "wouter";
import { Users, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useGetUserBalances,
  getGetUserBalancesQueryKey,
} from "@workspace/api-client-react";

interface FriendSummary {
  userId: number;
  name: string;
  net: number;
  groups: { groupId: number; groupName: string; direction: string; amount: number }[];
}

export default function Friends() {
  const user = useActiveUser();

  const { data: balances, isLoading } = useGetUserBalances(
    { userId: user.id },
    { query: { queryKey: getGetUserBalancesQueryKey({ userId: user.id }) } }
  );

  const friends = useMemo<FriendSummary[]>(() => {
    if (!balances) return [];
    const map = new Map<number, FriendSummary>();

    for (const b of balances) {
      const existing = map.get(b.withUserId);
      const delta = b.direction === "owed" ? b.amount : -b.amount;
      if (!existing) {
        map.set(b.withUserId, {
          userId: b.withUserId,
          name: b.withUserName,
          net: delta,
          groups: [{ groupId: b.groupId, groupName: b.groupName, direction: b.direction, amount: b.amount }],
        });
      } else {
        existing.net += delta;
        existing.groups.push({ groupId: b.groupId, groupName: b.groupName, direction: b.direction, amount: b.amount });
      }
    }

    return Array.from(map.values()).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [balances]);

  const totalOwedToYou = friends.filter((f) => f.net > 0).reduce((a, f) => a + f.net, 0);
  const totalYouOwe = friends.filter((f) => f.net < 0).reduce((a, f) => a + Math.abs(f.net), 0);

  return (
    <Layout title="Friends">
      <div className="space-y-5 pb-32">
        {/* Summary Bar */}
        {!isLoading && friends.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-primary mb-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">You're Owed</span>
                </div>
                <div className="font-mono font-bold text-lg text-primary">₹{totalOwedToYou.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                  <TrendingDown className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">You Owe</span>
                </div>
                <div className="font-mono font-bold text-lg text-destructive">₹{totalYouOwe.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Friend List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Balances</h3>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">All settled up!</p>
                <p className="text-xs text-muted-foreground mt-1">No outstanding balances with anyone.</p>
              </div>
            </div>
          ) : (
            <Card className="bg-card/60 backdrop-blur divide-y divide-border/50">
              {friends.map((friend) => {
                const isOwed = friend.net > 0;
                const isOwing = friend.net < 0;
                const isSettled = friend.net === 0;
                return (
                  <div key={friend.userId} className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0"
                      >
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{friend.name}</div>
                        <div className={`text-xs mt-0.5 ${isOwed ? "text-primary" : isOwing ? "text-destructive" : "text-muted-foreground"}`}>
                          {isOwed ? `owes you ₹${friend.net.toFixed(2)}` : isOwing ? `you owe ₹${Math.abs(friend.net).toFixed(2)}` : "settled up"}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-base ${isOwed ? "text-primary" : isOwing ? "text-destructive" : "text-muted-foreground"}`}>
                        {isOwed ? "+" : isOwing ? "-" : ""}₹{Math.abs(friend.net).toFixed(2)}
                      </div>
                    </div>

                    {/* Group breakdown */}
                    {friend.groups.length > 0 && (
                      <div className="mt-2 ml-13 pl-13 flex flex-wrap gap-1.5 ml-[52px]">
                        {friend.groups.map((g, i) => (
                          <Link key={i} href={`/groups/${g.groupId}`}>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                                g.direction === "owed" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {g.groupName} · ₹{g.amount.toFixed(2)}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
