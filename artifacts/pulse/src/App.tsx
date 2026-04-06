import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useAuth } from "@clerk/react";
import { Sun, Moon } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActiveUserProvider, useActiveUserState } from "@/hooks/use-active-user";
import { useTheme } from "@/hooks/use-theme";

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

function getClerkAppearance(theme: "dark" | "light") {
  const isDark = theme === "dark";
  return {
    variables: {
      colorPrimary: isDark ? "#39FF14" : "#16a34a",
      colorBackground: isDark ? "hsl(240 17% 8%)" : "#ffffff",
      colorInputBackground: isDark ? "hsl(240 10% 15%)" : "#f9fafb",
      colorInputText: isDark ? "#ffffff" : "#111827",
      colorText: isDark ? "#ffffff" : "#111827",
      colorTextSecondary: isDark ? "hsl(240 5% 64%)" : "#6b7280",
      borderRadius: "0.75rem",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    elements: {
      card: {
        style: isDark
          ? {
              background: "hsl(240 14% 10%)",
              border: "1px solid hsl(240 10% 18%)",
              boxShadow: "0 25px 50px -12px rgb(57 255 20 / 0.08)",
            }
          : {
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              boxShadow: "0 10px 40px -8px rgba(0,0,0,0.12)",
            },
      },
      // Google button always: white bg, dark readable text
      socialButtonsBlockButton: {
        style: {
          backgroundColor: "#ffffff",
          color: "#111827",
          border: "1px solid #d1d5db",
        },
      },
      socialButtonsBlockButtonText: {
        style: { color: "#111827", fontWeight: "500" as const },
      },
      dividerLine: {
        style: { background: isDark ? "hsl(240 10% 20%)" : "#e5e7eb" },
      },
      formFieldInput: isDark
        ? {
            style: {
              background: "hsl(240 10% 15%)",
              color: "#ffffff",
              border: "1px solid hsl(240 10% 22%)",
            },
          }
        : {},
    },
  };
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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 h-9 w-9 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function SignInPage() {
  const { theme } = useTheme();
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <ThemeToggle />
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={getClerkAppearance(theme)}
      />
    </div>
  );
}

function SignUpPage() {
  const { theme } = useTheme();
  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-4">
      <ThemeToggle />
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={getClerkAppearance(theme)}
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
  const { isLoading, error, refetch } = useActiveUserState();

  if (isLoading) return <AppLoadingScreen />;
  if (error) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-xl">!</span>
        </div>
        <div>
          <p className="text-foreground font-medium mb-1">Couldn't load your profile</p>
          <p className="text-muted-foreground text-sm">Check your connection and try again.</p>
        </div>
        <button
          onClick={refetch}
          className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
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
