import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Undo2 } from "lucide-react";
import { AppShell, BallChip } from "@/components/AppShell";
import { getMatch } from "@/lib/data";

export const Route = createFileRoute("/scoring/$matchId")({
  head: () => ({ meta: [
    { title: "Scorer console — GullyScore" },
    { name: "description", content: "Enter ball-by-ball events for a live match." },
    { property: "og:title", content: "Scorer console — GullyScore" },
    { property: "og:description", content: "Enter ball-by-ball events for a live match." },
  ] }),
  component: Scoring,
});

type Ball = { label: string; runs: number; legal: boolean; wicket: boolean };

function Scoring() {
  const m = getMatch(Route.useParams().matchId);
  const [balls, setBalls] = useState<Ball[]>([]);
  const base = { runs: 61, wkts: 3, legal: 38 };
  const runs = base.runs + balls.reduce((s, b) => s + b.runs, 0);
  const wkts = base.wkts + balls.filter((b) => b.wicket).length;
  const legal = base.legal + balls.filter((b) => b.legal).length;
  const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
  const add = (b: Ball) => setBalls((x) => [...x, b]);
  const target = 99;

  return (
    <AppShell back title="Scorer">
      <section className="bg-pitch-gradient px-4 pb-5 text-pitch-foreground">
        <p className="text-xs opacity-80">{m.teamB.name} · Target {target}</p>
        <p className="font-display text-5xl font-bold">{runs}/{wkts} <span className="text-xl font-normal opacity-80">({overs})</span></p>
        <p className="text-sm text-accent">Need {Math.max(target - runs, 0)} off {Math.max(60 - legal, 0)} balls</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{balls.slice(-8).map((b, i) => <BallChip key={i} v={b.label} />)}</div>
      </section>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3, 4, 6].map((r) => (
            <button key={r} onClick={() => add({ label: String(r), runs: r, legal: true, wicket: false })}
              className={`h-16 rounded-xl font-display text-2xl font-bold shadow-card ${r === 4 ? "bg-four text-primary-foreground" : r === 6 ? "bg-six text-primary-foreground" : "bg-card"}`}>{r}</button>
          ))}
          <button onClick={() => add({ label: "W", runs: 0, legal: true, wicket: true })} className="col-span-2 h-16 rounded-xl bg-wicket font-display text-2xl font-bold text-destructive-foreground">WICKET</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Wd", runs: 1, legal: false }, { label: "Nb", runs: 1, legal: false },
            { label: "B", runs: 1, legal: true }, { label: "Lb", runs: 1, legal: true },
          ].map((e) => (
            <button key={e.label} onClick={() => add({ ...e, wicket: false })} className="h-12 rounded-xl bg-secondary font-semibold text-secondary-foreground">{e.label}</button>
          ))}
        </div>
        <button onClick={() => setBalls((x) => x.slice(0, -1))} disabled={!balls.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold disabled:opacity-40"><Undo2 className="h-4 w-4" />Undo last ball</button>
        <div className="rounded-xl bg-card p-3 text-sm shadow-card">
          <p className="text-xs text-muted-foreground">On strike</p><p className="font-semibold">Ankit Jain · Mohit Saini</p>
          <p className="mt-2 text-xs text-muted-foreground">Bowling</p><p className="font-semibold">Deepak Joshi</p>
        </div>
        <p className="text-center text-xs text-muted-foreground">Preview mode — scores aren't saved yet.</p>
      </div>
    </AppShell>
  );
}
