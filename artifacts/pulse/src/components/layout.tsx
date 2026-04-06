import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useActiveUser } from "@/hooks/use-active-user";
import { useTheme } from "@/hooks/use-theme";
import { useClerk } from "@clerk/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Sun,
  Moon,
  LayoutDashboard,
  Users,
  Plus,
  ArrowLeftRight,
  Activity,
  Menu,
  LogOut,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/expenses/new", label: "Add Expense", icon: Plus },
  { href: "/settle", label: "Settle Up", icon: ArrowLeftRight },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/friends", label: "Friends", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const MOBILE_TAB_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/friends", label: "Friends", icon: UsersRound },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function NavLink({ href, label, icon: Icon }: (typeof NAV_ITEMS)[0]) {
  const [location] = useLocation();
  const isActive =
    href === "/" ? location === "/" : location.startsWith(href);
  return (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 cursor-pointer",
          isActive
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </span>
    </Link>
  );
}

export function ChaotechhPill() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 rounded-full border border-primary/40 bg-background/50 px-3 py-1.5 text-xs font-mono text-primary/70 backdrop-blur-md transition-all hover:border-primary hover:text-primary hover:bg-primary/10 active:scale-95 w-full justify-center lg:justify-start"
      >
        <span>⚡</span>
        <span className="hidden lg:inline">built by chaotechh</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                  <span className="text-xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Pulse is a Chaotechh Curation.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Crafted for the tech-forward. Built to make money feel less
                  like math and more like magic.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function DesktopSidebar() {
  const user = useActiveUser();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useClerk();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 border-r border-border/40 bg-card/80 backdrop-blur-xl z-40 px-3 py-4">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 mb-6">
        <div className="h-8 w-8 rounded-xl bg-primary/15 inline-flex items-center justify-center">
          <span className="text-primary font-bold text-base">₹</span>
        </div>
        <span className="font-bold text-lg tracking-tight">Pulse</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 pt-4 border-t border-border/40">
        <ChaotechhPill />

        <div className="flex items-center gap-2 px-3">
          <Link href="/profile">
            <div
              className="h-8 w-8 rounded-full inline-flex items-center justify-center text-sm font-bold text-white shrink-0 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          </Link>
          <span className="text-sm font-medium truncate flex-1 min-w-0">{user.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut()}
            className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MobileTabBar() {
  const [location] = useLocation();

  const tabs = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/groups", label: "Groups", icon: Users },
    null, // center add button placeholder
    { href: "/friends", label: "Friends", icon: UsersRound },
    { href: "/profile", label: "Profile", icon: UserRound },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/90 backdrop-blur-xl border-t border-border/40 safe-bottom">
      <div className="flex items-center h-16">
        {tabs.map((tab, idx) => {
          if (!tab) {
            const isAddActive = location.startsWith("/expenses/new");
            return (
              <Link key="add" href="/expenses/new" className="flex-1 flex justify-center">
                <span
                  className={cn(
                    "flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-90",
                    isAddActive && "scale-105 shadow-primary/50"
                  )}
                >
                  <Plus className="h-5 w-5" />
                </span>
              </Link>
            );
          }
          const isActive = tab.href === "/" ? location === "/" : location.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} className="flex-1">
              <span className="flex flex-col items-center justify-center h-16 gap-0.5 cursor-pointer active:scale-95 transition-transform select-none">
                <tab.icon className={cn(
                  "h-5 w-5 transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {tab.label}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}

export function Layout({
  children,
  showBack,
  backHref = "/",
  title,
  actions,
}: LayoutProps) {
  const user = useActiveUser();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useClerk();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-64 z-50 bg-card border-r border-border/40 flex flex-col px-3 py-4 lg:hidden"
            >
              <div className="flex items-center justify-between px-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/15 inline-flex items-center justify-center">
                    <span className="text-primary font-bold text-base">₹</span>
                  </div>
                  <span className="font-bold text-lg tracking-tight">Pulse</span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-1" onClick={() => setMobileNavOpen(false)}>
                {NAV_ITEMS.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </nav>

              <div className="space-y-3 pt-4 border-t border-border/40">
                <div className="px-3">
                  <ChaotechhPill />
                </div>
                <div className="flex items-center gap-2 px-3">
                  <div
                    className="h-8 w-8 rounded-full inline-flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium flex-1 min-w-0 truncate">{user.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setMobileNavOpen(false); signOut(); }}
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top header (always shown) */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/40 lg:ml-60">
        <div className="px-4 h-14 flex items-center justify-between gap-2">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger (only on mobile, only on root pages) */}
            {!showBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full lg:hidden active:scale-95 transition-transform"
                onClick={() => setMobileNavOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {/* Back button */}
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full active:scale-95 transition-transform"
                asChild
              >
                <Link href={backHref}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <h1 className="font-semibold text-base tracking-tight truncate">
              {title || "Pulse"}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            {actions}
            {/* Theme toggle (mobile only — desktop has it in the sidebar) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full active:scale-95 transition-transform text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            {/* Avatar tap → profile (mobile non-back pages) */}
            {!showBack && (
              <Link href="/profile">
                <div
                  className="h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-white shrink-0 lg:hidden cursor-pointer active:scale-95 transition-transform"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:ml-60 px-4 py-4 pb-28 lg:pb-8">
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  );
}
