import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/draft")({
  head: () => ({ meta: [
    { title: "Player draft — GullyScore" },
    { name: "description", content: "Captains pick players in turn from the match pool." },
    { property: "og:title", content: "Player draft — GullyScore" },
    { property: "og:description", content: "Captains pick players in turn from the match pool." },
  ] }),
  component: Draft,
});

const pool = ["Arjun Mehta","Karan Gupta","Nikhil Rao","Pranav Iyer","Suresh Kumar","Ravi Shukla","Gaurav Mishra","Harsh Pandey","Yash Chauhan","Ankit Jain","Mohit Saini","Tarun Bhatt","Varun Nair","Vikas Yadav"];
const caps = [{ name: "Rahul Verma", team: "Lions" }, { name: "Manish Tiwari", team: "Strikers" }];

function Draft() {
  const [picks, setPicks] = useState<{ player: string; team: number }[]>([]);
  const turn = picks.length % 2;
  const taken = new Set(picks.map((p) => p.player));
  return (
    <AppShell>
      <section className="bg-pitch-gradient px-4 pb-4 text-pitch-foreground">
        <p className="text-xs opacity-80">Sunday League · Match 8 draft</p>
        <p className="font-display text-2xl font-bold">{caps[turn].name}'s pick <span className="text-accent">#{picks.length + 1}</span></p>
      </section>
      <div className="grid grid-cols-2 gap-3 p-4">
        {caps.map((c, i) => (
          <div key={c.name} className={`rounded-xl bg-card p-3 shadow-card ${turn === i ? "ring-2 ring-accent" : ""}`}>
            <p className="font-display text-lg font-bold">{c.team}</p>
            <p className="text-xs text-muted-foreground">C: {c.name}</p>
            {picks.filter((p) => p.team === i).map((p) => <p key={p.player} className="text-sm">{p.player}</p>)}
          </div>
        ))}
      </div>
      <div className="px-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">AVAILABLE · {pool.length - taken.size}</p>
        <div className="space-y-2">
          {pool.map((p) => (
            <button key={p} disabled={taken.has(p)} onClick={() => setPicks((x) => [...x, { player: p, team: turn }])}
              className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card disabled:opacity-40">
              <span className="font-medium">{p}</span>
              <span className="text-sm font-semibold text-primary">{taken.has(p) ? "Picked" : "Pick"}</span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
