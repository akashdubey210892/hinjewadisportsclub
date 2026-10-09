import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { AppShell, LiveBadge } from "@/components/AppShell";
import { matches, type Status, type Match } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "GullyScore — Live local cricket scores" },
    { name: "description", content: "Live ball-by-ball scores, scorecards and drafts for local and box cricket matches." },
    { property: "og:title", content: "GullyScore — Live local cricket scores" },
    { property: "og:description", content: "Live ball-by-ball scores, scorecards and drafts for local cricket." },
  ] }),
  component: Index,
});

function MatchCard({ m }: { m: Match }) {
  return (
    <Link to="/match/$matchId" params={{ matchId: m.id }} className="block rounded-xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{m.title}</span>
        {m.status === "live" ? <LiveBadge /> : <span>{m.date}</span>}
      </div>
      {[m.teamA, m.teamB].map((t, i) => {
        const inn = m.innings.find((x) => x.team === t.short) ?? m.innings[i];
        return (
          <div key={t.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">{t.short}</span>
              <span className="font-semibold">{t.name}</span>
            </div>
            {inn && <span className="font-display text-lg font-bold">{inn.runs}/{inn.wickets} <span className="text-xs font-normal text-muted-foreground">({inn.overs})</span></span>}
          </div>
        );
      })}
      <p className={`mt-2 text-sm ${m.status === "live" ? "text-live font-medium" : m.status === "completed" ? "text-primary font-medium" : "text-muted-foreground"}`}>{m.summary}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{m.venue}</p>
    </Link>
  );
}

function Index() {
  const [tab, setTab] = useState<Status>("live");
  const list = matches.filter((m) => m.status === tab);
  return (
    <AppShell>
      <div className="bg-pitch-gradient px-4 pb-4 text-pitch-foreground">
        <div className="flex gap-1 rounded-lg bg-pitch-foreground/10 p-1">
          {(["live", "upcoming", "completed"] as Status[]).map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold capitalize transition ${tab === s ? "bg-card text-foreground" : ""}`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {list.map((m) => <MatchCard key={m.id} m={m} />)}
        <button className="w-full rounded-xl border-2 border-dashed border-primary/40 py-3 font-semibold text-primary">+ Create match</button>
      </div>
    </AppShell>
  );
}
