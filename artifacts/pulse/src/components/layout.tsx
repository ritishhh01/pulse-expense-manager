import { useState } from "react";
import { Link } from "wouter";
import { useActiveUser } from "@/hooks/use-active-user";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
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
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
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
  title?: string;
  actions?: React.ReactNode;
}

export function Layout({ children, showBack, title, actions }: LayoutProps) {
  const user = useActiveUser();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container mx-auto max-w-lg px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full active:scale-95 transition-transform" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <h1 className="font-semibold text-lg tracking-tight">
              {title || "Pulse"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {!showBack && (
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-lg p-4">
        {children}
      </main>

      <ChaotechhPill />
    </div>
  );
}
