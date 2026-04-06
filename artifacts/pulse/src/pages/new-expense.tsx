import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Minus, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Layout } from "@/components/layout";
import { ELI7Tooltip } from "@/components/eli7-tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useListGroups,
  getListGroupsQueryKey,
  useGetGroup,
  getGetGroupQueryKey,
  useCreateExpense,
  getListExpensesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetUserBalancesQueryKey,
} from "@workspace/api-client-react";

const CATEGORIES = ["food", "travel", "entertainment", "shopping", "utilities", "health", "others"];

const formSchema = z.object({
  groupId: z.coerce.number().positive("Select a group"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Select a category"),
});

export default function NewExpense() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const presetGroupId = searchParams.get("groupId") ? parseInt(searchParams.get("groupId")!, 10) : undefined;

  const { toast } = useToast();
  const user = useActiveUser();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(presetGroupId);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupId: presetGroupId || 0,
      description: "",
      amount: 0,
      category: "others",
    },
  });

  const { data: groups } = useListGroups({ query: { queryKey: getListGroupsQueryKey() } });
  const { data: groupDetail } = useGetGroup(selectedGroupId!, {
    query: { enabled: !!selectedGroupId, queryKey: getGetGroupQueryKey(selectedGroupId!) },
  });

  const members = groupDetail?.members || [];
  const totalAmount = form.watch("amount") || 0;
  const equalSplit = members.length > 0 ? totalAmount / members.length : 0;

  const [customSplits, setCustomSplits] = useState<Record<number, number>>({});

  useEffect(() => {
    if (members.length > 0) {
      const equal = parseFloat((totalAmount / members.length).toFixed(2));
      const splits: Record<number, number> = {};
      members.forEach((m) => { splits[m.id] = equal; });
      setCustomSplits(splits);
    }
  }, [members.length, totalAmount]);

  const createExpense = useCreateExpense();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const splits = members.map((m) => ({
      userId: m.id,
      amount: splitMode === "equal"
        ? parseFloat((values.amount / members.length).toFixed(2))
        : customSplits[m.id] || 0,
    }));

    createExpense.mutate(
      {
        data: {
          groupId: values.groupId,
          description: values.description,
          amount: values.amount,
          category: values.category,
          paidByUserId: user.id,
          splits,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListExpensesQueryKey({ groupId: values.groupId }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getGetUserBalancesQueryKey({ userId: user.id }) });
          toast({ title: "Expense added!", description: `₹${values.amount} split among ${members.length} people.` });
          setLocation(selectedGroupId ? `/groups/${selectedGroupId}` : "/");
        },
        onError: () => {
          toast({ title: "Failed to add expense", variant: "destructive" });
        },
      }
    );
  }

  return (
    <Layout title="Add Expense" showBack backHref="/groups">
      <div className="pt-4 pb-32">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Group</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(parseInt(v, 10));
                      setSelectedGroupId(parseInt(v, 10));
                    }}
                    defaultValue={presetGroupId ? String(presetGroupId) : undefined}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-card/50 border-border/50 h-12 focus:ring-primary">
                        <SelectValue placeholder="Pick a group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {groups?.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.emoji} {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">What for?</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Dinner at Hakkasan"
                      className="bg-card/50 h-12 text-base border-border/50 focus-visible:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Total Amount (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-lg">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-card/50 h-14 text-2xl font-bold font-mono pl-8 border-border/50 focus-visible:ring-primary"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-card/50 border-border/50 h-12 focus:ring-primary">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Split Logic */}
            {members.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <ELI7Tooltip term="Split Logic" explanation="This is how we figure out who pays what — like cutting a pizza into fair slices for everyone!" />
                  </h3>
                  <div className="flex gap-1 bg-card/50 rounded-full p-1 border border-border/50">
                    <button
                      type="button"
                      onClick={() => setSplitMode("equal")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${splitMode === "equal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Equal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode("custom")}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${splitMode === "custom" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                <Card className="bg-card/60 divide-y divide-border/50">
                  {members.map((member) => (
                    <div key={member.id} className="p-3 flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span className="flex-1 text-sm font-medium">
                        {member.name}{member.id === user.id && " (you)"}
                      </span>
                      {splitMode === "equal" ? (
                        <span className="font-mono text-sm font-semibold text-muted-foreground">
                          ₹{equalSplit.toFixed(2)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={customSplits[member.id] || ""}
                          onChange={(e) =>
                            setCustomSplits((prev) => ({
                              ...prev,
                              [member.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-24 text-right bg-muted/50 rounded-lg border border-border/50 px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                  ))}
                </Card>
              </div>
            )}

            <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent">
              <div className="container max-w-lg mx-auto">
                <Button
                  type="submit"
                  className="w-full rounded-2xl h-14 text-lg font-semibold active:scale-[0.98] transition-transform shadow-xl shadow-primary/10"
                  disabled={createExpense.isPending}
                >
                  {createExpense.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding...</>
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
