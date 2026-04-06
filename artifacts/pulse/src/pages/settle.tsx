import { useState } from "react";
import { useSearch, Link } from "wouter";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { Layout } from "@/components/layout";
import { ELI7Tooltip } from "@/components/eli7-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useGetUserBalances,
  getGetUserBalancesQueryKey,
  useCreateSettlement,
  getListSettlementsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";

function ConfettiEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: `${Math.random() * 100}vw`,
            y: "-5vh",
            rotate: Math.random() * 360,
            opacity: 1,
          }}
          animate={{
            y: "110vh",
            rotate: Math.random() * 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 1.5,
            delay: Math.random() * 0.5,
            ease: "easeIn",
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: ["#39FF14", "#00D4FF", "#FF6B35", "#B45DFF", "#FFD700"][
              Math.floor(Math.random() * 5)
            ],
          }}
        />
      ))}
    </div>
  );
}

export default function Settle() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const filterGroupId = searchParams.get("groupId") ? parseInt(searchParams.get("groupId")!, 10) : undefined;

  const { toast } = useToast();
  const user = useActiveUser();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(false);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());

  const { data: balances, isLoading } = useGetUserBalances(
    { userId: user.id },
    { query: { queryKey: getGetUserBalancesQueryKey({ userId: user.id }) } }
  );

  const createSettlement = useCreateSettlement();

  const debts = balances?.filter((b) => {
    if (b.direction !== "owe") return false;
    if (filterGroupId && b.groupId !== filterGroupId) return false;
    return true;
  }) || [];

  const owed = balances?.filter((b) => {
    if (b.direction !== "owed") return false;
    if (filterGroupId && b.groupId !== filterGroupId) return false;
    return true;
  }) || [];

  function handleSettle(balance: typeof debts[0]) {
    const key = `${balance.groupId}-${balance.withUserId}`;
    createSettlement.mutate(
      {
        data: {
          groupId: balance.groupId,
          fromUserId: user.id,
          toUserId: balance.withUserId,
          amount: balance.amount,
        },
      },
      {
        onSuccess: () => {
          setSettledIds((prev) => new Set([...prev, key]));
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          queryClient.invalidateQueries({ queryKey: getGetUserBalancesQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getListSettlementsQueryKey() });
          toast({
            title: "Settled up!",
            description: `You settled ₹${balance.amount.toFixed(2)} with ${balance.withUserName}`,
          });
        },
        onError: () => {
          toast({ title: "Settlement failed", variant: "destructive" });
        },
      }
    );
  }

  function buildUpiLink(upiId: string, name: string, amount: number) {
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
  }

  return (
    <Layout title="Settle Up" showBack backHref="/">
      <AnimatePresence>{showConfetti && <ConfettiEffect />}</AnimatePresence>

      <div className="space-y-6 pb-24">
        {/* You Owe Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ELI7Tooltip term="Settle Up" explanation="Click this to tell your friend 'Hey, give me my candy money back!' so everyone is even." />
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          ) : debts.length === 0 ? (
            <Card className="bg-card/60">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">All clear!</h3>
                <p className="text-sm text-muted-foreground">You don't owe anyone right now. You're the GOAT.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {debts.map((balance, idx) => {
                const key = `owe-${balance.groupId}-${balance.withUserId}-${idx}`;
                const isSettled = settledIds.has(`${balance.groupId}-${balance.withUserId}`);
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <Card className={`bg-card/60 border-destructive/20 ${isSettled ? "opacity-50" : ""}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-bold">
                              {balance.withUserName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold">{balance.withUserName}</div>
                              <div className="text-xs text-muted-foreground">{balance.groupName}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-destructive text-lg">₹{balance.amount.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">you owe</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {balance.withUserUpiId ? (
                            <Button
                              asChild
                              size="sm"
                              variant="secondary"
                              className="flex-1 rounded-full text-xs active:scale-95 transition-transform gap-1"
                            >
                              <a href={buildUpiLink(balance.withUserUpiId, balance.withUserName, balance.amount)}>
                                <ExternalLink className="h-3 w-3" />
                                <ELI7Tooltip term="UPI Intent" explanation="This opens your payment app automatically so you can pay without typing anything — like magic!" />
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="flex-1 rounded-full text-xs text-muted-foreground" disabled>
                              No UPI ID set
                            </Button>
                          )}
                          <Button
                            size="sm"
                            className="flex-1 rounded-full text-xs bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
                            onClick={() => handleSettle(balance)}
                            disabled={createSettlement.isPending || isSettled}
                          >
                            {isSettled ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Settled!</>
                            ) : createSettlement.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Mark Settled"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Owed to You Section */}
        {owed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owed to You</h2>
            <div className="space-y-3">
              {owed.map((balance, idx) => (
                <Card key={`owed-${balance.groupId}-${balance.withUserId}-${idx}`} className="bg-card/60 border-primary/20">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {balance.withUserName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{balance.withUserName}</div>
                        <div className="text-xs text-muted-foreground">{balance.groupName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary text-lg">₹{balance.amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">owes you</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
