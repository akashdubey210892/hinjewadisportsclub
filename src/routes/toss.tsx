import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/toss")({
  head: () => ({ meta: [
    { title: "Toss — GullyScore" },
    { name: "description", content: "Flip the coin and choose to bat or bowl." },
  ] }),
  component: Toss,
});

function Toss() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [call, setCall] = useState<"Heads" | "Tails">("Heads");
  const [result, setResult] = useState<string | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);
  if (loading || !isAdmin) return <AppShell back title="Toss"><p className="p-6 text-center text-sm text-muted-foreground">Checking admin access…</p></AppShell>;
  const winner = result ? "Toss winner" : null;
  return (
    <AppShell back title="Toss">
      <div className="space-y-5 p-6 text-center">
        <p className="text-sm text-muted-foreground">Toss setup</p>
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-accent font-display text-3xl font-bold text-accent-foreground shadow-card">{result ?? "?"}</div>
        <p className="text-sm">Select the toss call:</p>
        <div className="flex justify-center gap-2">{(["Heads", "Tails"] as const).map((c) => <button key={c} onClick={() => setCall(c)} className={`rounded-full px-5 py-2 font-semibold ${call === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{c}</button>)}</div>
        <button onClick={() => { setChoice(null); setResult(Math.random() < 0.5 ? "Heads" : "Tails"); }} className="w-full rounded-xl bg-pitch-gradient py-3 font-semibold text-pitch-foreground">Flip coin</button>
        {winner && <div className="rounded-xl bg-card p-4 shadow-card"><p className="font-display text-xl font-bold">Toss result: {result}</p><div className="mt-3 flex gap-2">{["Bat", "Bowl"].map((c) => <button key={c} onClick={() => setChoice(c)} className={`flex-1 rounded-lg py-2 font-semibold ${choice === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{c}</button>)}</div>{choice && <p className="mt-3 text-sm text-primary">Winner chose to {choice.toLowerCase()} first</p>}</div>}
      </div>
    </AppShell>
  );
}
