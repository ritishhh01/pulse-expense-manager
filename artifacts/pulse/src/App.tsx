import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveUserProvider } from "@/hooks/use-active-user";

import Dashboard from "@/pages/dashboard";
import Groups from "@/pages/groups";
import NewGroup from "@/pages/new-group";
import GroupDetail from "@/pages/group-detail";
import NewExpense from "@/pages/new-expense";
import ExpenseDetail from "@/pages/expense-detail";
import Settle from "@/pages/settle";
import Activity from "@/pages/activity";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/new" component={NewGroup} />
      <Route path="/groups/:id" component={GroupDetail} />
      <Route path="/expenses/new" component={NewExpense} />
      <Route path="/expenses/:id" component={ExpenseDetail} />
      <Route path="/settle" component={Settle} />
      <Route path="/activity" component={Activity} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ActiveUserProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ActiveUserProvider>
    </QueryClientProvider>
  );
}

export default App;
