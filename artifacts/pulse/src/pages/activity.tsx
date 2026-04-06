import { Link } from "wouter";
import { format } from "date-fns";
import { Receipt, CheckCircle2, Users } from "lucide-react";

import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";

const TYPE_CONFIG = {
  expense_added: { icon: Receipt, bgColor: "bg-primary/20", textColor: "text-primary" },
  settlement_done: { icon: CheckCircle2, bgColor: "bg-blue-500/20", textColor: "text-blue-400" },
  group_joined: { icon: Users, bgColor: "bg-purple-500/20", textColor: "text-purple-400" },
};

export default function Activity() {
  const user = useActiveUser();

  const { data: activity, isLoading } = useGetRecentActivity(
    { userId: user.id },
    { query: { queryKey: getGetRecentActivityQueryKey({ userId: user.id }) } }
  );

  return (
    <Layout title="Activity" showBack>
      <div className="space-y-4 pb-24">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))
        ) : activity?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No activity yet. Start adding expenses!</p>
          </div>
        ) : (
          <Card className="bg-card/60 divide-y divide-border/50">
            {activity?.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.expense_added;
              const Icon = config.icon;
              return (
                <div key={item.id} className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${config.bgColor}`}>
                    <Icon className={`h-5 w-5 ${config.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span className="font-medium truncate max-w-[120px] inline-block">{item.groupName}</span>
                      <span>·</span>
                      <span>{format(new Date(item.createdAt), "MMM d, h:mm a")}</span>
                    </p>
                  </div>
                  {item.amount != null && (
                    <div className="font-mono text-sm font-semibold shrink-0">
                      ₹{item.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </Layout>
  );
}
