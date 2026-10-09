import { Link } from "@tanstack/react-router";
import { Home, Radio, Users, Trophy } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ title, children, back }: { title?: string; children: ReactNode; back?: boolean }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      <header className="sticky top-0 z-20 bg-pitch-gradient px-4 py-3 text-pitch-foreground">
        <div className="flex items-center justify-between">
          {back ? (
            <Link to="/" className="font-display text-lg font-semibold">← {title}</Link>
          ) : (
            <span className="font-display text-2xl font-bold tracking-wide">GULLY<span className="text-accent">SCORE</span></span>
          )}
          <span className="rounded-full bg-pitch-foreground/15 px-2 py-0.5 text-xs">Preview</span>
        </div>
      </header>
      {children}
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-card py-2 text-xs">
        {[
          { to: "/", icon: Home, label: "Home" },
          { to: "/scoring/$matchId", icon: Radio, label: "Score", params: { matchId: "m1" } },
          { to: "/draft", icon: Users, label: "Draft" },
          { to: "/toss", icon: Trophy, label: "Toss" },
        ].map((n) => (
          <Link key={n.label} to={n.to} params={n.params as never} className="flex flex-col items-center gap-0.5 text-muted-foreground"
            activeProps={{ className: "text-primary font-semibold" }} activeOptions={{ exact: true }}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-xs font-bold text-live">
      <span className="h-1.5 w-1.5 rounded-full bg-live animate-live" /> LIVE
    </span>
  );
}

export function BallChip({ v }: { v: string }) {
  const cls = v === "4" ? "bg-four text-primary-foreground" : v === "6" ? "bg-six text-primary-foreground"
    : v === "W" ? "bg-wicket text-destructive-foreground" : v === "0" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-xs font-bold ${cls}`}>{v}</span>;
}
