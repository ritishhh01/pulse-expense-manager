import { useState } from "react";
import { Link } from "wouter";
import { useActiveUser } from "@/hooks/use-active-user";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChaotechhPill() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 rounded-full border border-primary/40 bg-white/5 px-4 py-2 text-xs font-mono text-primary/80 backdrop-blur-md transition-all hover:border-primary hover:text-primary hover:bg-primary/10 active:scale-95"
        >
          <span>⚡</span>
          <span>built by chaotechh</span>
        </button>
      </div>

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
                  Crafted for the tech-forward. Built to make money feel less like math and more like magic.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}

export function Layout({ children, showBack, backHref = "/", title, actions }: LayoutProps) {
  const user = useActiveUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container mx-auto max-w-lg px-4 h-16 flex items-center justify-between gap-2">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0">
            {showBack ? (
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
            ) : null}
            <h1 className="font-semibold text-lg tracking-tight truncate">
              {title || "Pulse"}
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 shrink-0">
            {actions}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full active:scale-95 transition-transform text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Avatar — only on home/non-back pages */}
            {!showBack && (
              <div
                className="h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-4">
        {children}
      </main>

      <ChaotechhPill />
    </div>
  );
}
