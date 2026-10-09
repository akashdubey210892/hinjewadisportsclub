import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { MapPin } from "lucide-react";
import { AppShell, LiveBadge } from "@/components/AppShell";
import { matches, type Status, type Match } from "@/lib/data";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "GullyScore — Live local cricket scores" },
    { name: "description", content: "Live ball-by-ball scores, scorecards and drafts for local and box cricket matches." },
    { property: "og:title", content: "GullyScore — Live local cricket scores" },
    { property: "og:description", content: "Live ball-by-ball scores, scorecards and drafts for local cricket." },
  ] }),
  component: Index,
});

type LiveScore = { runs: number; wkts: number; legal: number; target?: number; updatedAt?: number };

function MatchCard({ m }: { m: Match }) {
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "matchScores", m.id), (snapshot) => {
      setLiveScore(snapshot.exists() ? snapshot.data() as LiveScore : null);
    });
  }, [m.id]);

  return (
    <Link to="/match/$matchId" params={{ matchId: m.id }} className="block rounded-xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{m.title}</span>
        {m.status === "live" ? <LiveBadge /> : <span>{m.date}</span>}
      </div>
      {[m.teamA, m.teamB].map((t, i) => {
        const inn = m.innings.find((x) => x.team === t.short) ?? m.innings[i];
        const isChasing = i === 1 && Boolean(liveScore);
        const runs = isChasing && liveScore ? liveScore.runs : inn?.runs;
        const wickets = isChasing && liveScore ? liveScore.wkts : inn?.wickets;
        const overs = isChasing && liveScore ? `${Math.floor(liveScore.legal / 6)}.${liveScore.legal % 6}` : inn?.overs;
        return (
          <div key={t.id} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">{t.short}</span><span className="font-semibold">{t.name}</span></div>
            {runs !== undefined && wickets !== undefined && <span className="font-display text-lg font-bold">{runs}/{wickets} <span className="text-xs font-normal text-muted-foreground">({overs})</span></span>}
          </div>
        );
      })}
      <p className={`mt-2 text-sm ${m.status === "live" ? "text-live font-medium" : m.status === "completed" ? "text-primary font-medium" : "text-muted-foreground"}`}>{liveScore && m.status === "live" ? `CRR ${liveScore.legal ? (liveScore.runs / (liveScore.legal / 6)).toFixed(2) : "0.00"} · Need ${Math.max((liveScore.target ?? 99) - liveScore.runs, 0)} runs` : m.summary}</p>
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
          {(["live", "upcoming", "completed"] as Status[]).map((s) => <button key={s} onClick={() => setTab(s)} className={`flex-1 rounded-md py-1.5 text-sm font-semibold capitalize transition ${tab === s ? "bg-card text-foreground" : ""}`}>{s}</button>)}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {list.map((m) => <MatchCard key={m.id} m={m} />)}
        <p className="text-center text-xs text-muted-foreground">Live score updates appear automatically when Firebase is configured.</p>
      </div>
    </AppShell>
  );
}
