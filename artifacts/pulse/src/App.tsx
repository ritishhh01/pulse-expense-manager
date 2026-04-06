import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveUserProvider, useActiveUserState } from "@/hooks/use-active-user";

import Dashboard from "@/pages/dashboard";
import Groups from "@/pages/groups";
import NewGroup from "@/pages/new-group";
import GroupDetail from "@/pages/group-detail";
import NewExpense from "@/pages/new-expense";
import ExpenseDetail from "@/pages/expense-detail";
import Settle from "@/pages/settle";
import Activity from "@/pages/activity";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 1 },
  },
});

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    return addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevIdRef.current !== undefined && prevIdRef.current !== id) {
        qc.clear();
      }
      prevIdRef.current = id;
    });
  }, [addListener, qc]);
  return null;
}

function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={{
          variables: {
            colorPrimary: "#39FF14",
            colorBackground: "hsl(240 17% 8%)",
            colorInputBackground: "hsl(240 10% 15%)",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "hsl(240 5% 60%)",
            colorNeutral: "hsl(240 10% 20%)",
            borderRadius: "0.75rem",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          elements: {
            card: "shadow-2xl shadow-primary/10 border border-border/40 bg-card",
          },
        }}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={{
          variables: {
            colorPrimary: "#39FF14",
            colorBackground: "hsl(240 17% 8%)",
            colorInputBackground: "hsl(240 10% 15%)",
            colorInputText: "#ffffff",
            colorText: "#ffffff",
            colorTextSecondary: "hsl(240 5% 60%)",
            colorNeutral: "hsl(240 10% 20%)",
            borderRadius: "0.75rem",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          elements: {
            card: "shadow-2xl shadow-primary/10 border border-border/40 bg-card",
          },
        }}
      />
    </div>
  );
}

function AppLoadingScreen() {
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center animate-pulse">
          <span className="text-primary font-bold text-xl">₹</span>
        </div>
        <div className="text-sm text-muted-foreground font-mono">Loading Pulse…</div>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { isLoading, error } = useActiveUserState();

  if (isLoading) return <AppLoadingScreen />;
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center text-destructive text-sm">
        Failed to load profile. Please refresh.
      </div>
    );
  }

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

function Router() {
  const { isLoaded } = useAuth();

  if (!isLoaded) return <AppLoadingScreen />;

  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route>
        <>
          <Show when="signed-in">
            <ActiveUserProvider>
              <AuthenticatedApp />
            </ActiveUserProvider>
          </Show>
          <Show when="signed-out">
            <Landing />
          </Show>
        </>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl || undefined}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
