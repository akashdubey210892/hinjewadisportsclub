import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Radio, Users, Trophy, LogIn, LogOut, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export function AppShell({ title, children, back }: { title?: string; children: ReactNode; back?: boolean }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    await navigate({ to: "/" });
  }

  const navItems = [
    { to: "/", icon: Home, label: "Home", protected: false, params: undefined },
    { to: "/scoring/$matchId", icon: Radio, label: "Score", params: { matchId: "m1" }, protected: true },
    { to: "/draft", icon: Users, label: "Draft", protected: true, params: undefined },
    { to: "/toss", icon: Trophy, label: "Toss", protected: true, params: undefined },
    { to: "/players", icon: UserRound, label: "Players", protected: true, params: undefined },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-20">
      <header className="sticky top-0 z-20 bg-pitch-gradient px-4 py-3 text-pitch-foreground">
        <div className="flex items-center justify-between gap-2">
          {back ? (
            <Link to="/" className="min-w-0 truncate font-display text-lg font-semibold">← {title}</Link>
          ) : (
            <Link to="/" className="font-display text-2xl font-bold tracking-wide">GULLY<span className="text-accent">SCORE</span></Link>
          )}
          {!loading && (isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-pitch-foreground/15 px-2 py-1 text-xs">Admin</span>
              <button onClick={() => void handleLogout()} className="inline-flex items-center gap-1 rounded-lg bg-pitch-foreground/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-pitch-foreground/25">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">
              <LogIn className="h-4 w-4" /> Login
            </Link>
          ))}
        </div>
      </header>
      {children}
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-around border-t bg-card py-2 text-[11px]">
        {navItems.map((n) => {
          const destination = n.protected && !isAdmin ? "/login" : n.to;
          return (
            <Link key={n.label} to={destination as never} params={destination === n.to ? n.params as never : undefined}
              className="flex min-w-0 flex-col items-center gap-0.5 px-1 text-muted-foreground"
              activeProps={{ className: "flex min-w-0 flex-col items-center gap-0.5 px-1 text-primary font-semibold" }}
              activeOptions={{ exact: true }}>
              <n.icon className="h-5 w-5" />{n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function LiveBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 text-xs font-bold text-live"><span className="h-1.5 w-1.5 rounded-full bg-live animate-live" /> LIVE</span>;
}

export function BallChip({ v }: { v: string }) {
  const cls = v === "4" ? "bg-four text-primary-foreground" : v === "6" ? "bg-six text-primary-foreground"
    : v === "W" ? "bg-wicket text-destructive-foreground" : v === "0" ? "bg-muted text-muted-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-xs font-bold ${cls}`}>{v}</span>;
}
