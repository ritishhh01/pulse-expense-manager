import { Link } from "wouter";
import { ArrowRight, Users, Receipt, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/15 inline-flex items-center justify-center">
            <span className="text-primary font-bold text-base">₹</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Pulse</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10">
          <a href={`${basePath}/sign-in`}>Sign in</a>
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-mono text-primary mb-8">
          <Zap className="h-3 w-3" />
          built by chaotechh
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight max-w-lg mb-4">
          Split expenses,{" "}
          <span className="text-primary">not friendships.</span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-sm mb-10 leading-relaxed">
          Pulse makes group expenses effortless. Add friends, split bills instantly, and settle up with one tap via UPI.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform"
          >
            <a href={`${basePath}/sign-up`}>
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full px-8 text-muted-foreground hover:text-foreground">
            <a href={`${basePath}/sign-in`}>Sign in instead</a>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl w-full text-left">
          {[
            { icon: Users, title: "Group Expenses", desc: "Create groups for trips, roommates, or any occasion. Add members instantly." },
            { icon: Receipt, title: "Smart Splits", desc: "Split equally or customize per person. Pulse tracks who owes what in real-time." },
            { icon: Zap, title: "UPI Settle", desc: "One-tap UPI deep-links open your payment app so settling up takes seconds." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card/60 border border-border/50 rounded-2xl p-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-muted-foreground border-t border-border/30">
        ⚡ a chaotechh product
      </footer>
    </div>
  );
}
