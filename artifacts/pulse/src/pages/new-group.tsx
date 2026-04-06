import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useActiveUser } from "@/hooks/use-active-user";
import {
  useCreateGroup,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50),
  description: z.string().max(100).optional(),
  emoji: z.string().min(1, "Pick an emoji!").max(5, "Just one emoji please"),
});

const EMOJI_PRESETS = ["🏠", "✈️", "🍔", "🎉", "🚗", "💻", "🎮", "⚽"];

export default function NewGroup() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const user = useActiveUser();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      emoji: "🏠",
    },
  });

  const createGroup = useCreateGroup();

  function onSubmit(values: z.infer<typeof formSchema>) {
    createGroup.mutate(
      {
        data: {
          name: values.name,
          description: values.description || null,
          emoji: values.emoji,
          createdByUserId: user.id,
          // Start with just the active user in the group
          memberUserIds: [user.id] 
        }
      },
      {
        onSuccess: (newGroup) => {
          queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
          toast({
            title: "Group created!",
            description: `${values.name} is ready for expenses.`,
          });
          setLocation(`/groups/${newGroup.id}`);
        },
        onError: (error) => {
          toast({
            title: "Failed to create group",
            description: "Something went wrong.",
            variant: "destructive",
          });
        }
      }
    );
  }

  return (
    <Layout title="New Group" showBack backHref="/groups">
      <div className="pt-4 pb-32">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center mb-8">
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Input 
                        {...field} 
                        className="text-6xl h-28 w-28 text-center bg-card/50 border-primary/20 rounded-full pb-2 shadow-2xl relative z-10 focus-visible:ring-primary"
                        maxLength={2}
                      />
                    </div>
                  </FormControl>
                  <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    {EMOJI_PRESETS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => form.setValue("emoji", e)}
                        className="h-10 w-10 rounded-full bg-card hover:bg-muted active:scale-95 transition-all text-xl border border-border/50"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Group Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Goa Trip 🌴" 
                      className="bg-card/50 h-12 text-lg font-medium border-border/50 focus-visible:ring-primary focus-visible:border-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground uppercase text-xs tracking-wider">Description (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Flights, hotels, and parties" 
                      className="bg-card/50 border-border/50 focus-visible:ring-primary"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bottom sticky button */}
            <div className="fixed bottom-0 left-0 lg:left-60 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent">
              <div className="container max-w-lg mx-auto">
                <Button 
                  type="submit" 
                  className="w-full rounded-2xl h-14 text-lg font-semibold active:scale-[0.98] transition-transform shadow-xl shadow-primary/10"
                  disabled={createGroup.isPending}
                >
                  {createGroup.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
                  ) : (
                    "Create Group"
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
