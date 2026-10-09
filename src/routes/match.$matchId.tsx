import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, BallChip, LiveBadge } from "@/components/AppShell";
import { battingCard, bowlingCard, commentary, getMatch } from "@/lib/data";

export const Route = createFileRoute("/match/$matchId")({
  head: () => ({ meta: [
    { title: "Match centre — GullyScore" },
    { name: "description", content: "Live score, scorecard, commentary and squads." },
    { property: "og:title", content: "Match centre — GullyScore" },
    { property: "og:description", content: "Live score, scorecard, commentary and squads." },
  ] }),
  component: MatchPage,
});

const tabs = ["Live", "Scorecard", "Commentary", "Squads"] as const;

function MatchPage() {
  const m = getMatch(Route.useParams().matchId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Live");
  const [a, b] = m.innings;
  return (
    <AppShell back title={m.title}>
      <section className="bg-pitch-gradient px-4 pb-5 pt-2 text-pitch-foreground">
        <div className="flex items-center justify-between text-xs opacity-80"><span>{m.venue}</span>{m.status === "live" && <LiveBadge />}</div>
        {a ? (
          <div className="mt-3 space-y-1">
            <p className="text-sm opacity-80">{a.team} {a.runs}/{a.wickets} ({a.overs})</p>
            {b && <p className="font-display text-4xl font-bold">{b.team} {b.runs}/{b.wickets} <span className="text-lg font-normal opacity-80">({b.overs})</span></p>}
            <p className="text-sm font-medium text-accent">{m.summary}</p>
            {m.status === "live" && <p className="text-xs opacity-70">CRR 9.63 · REQ 10.36</p>}
          </div>
        ) : (
          <p className="mt-4 font-display text-3xl font-bold">{m.teamA.short} vs {m.teamB.short}<span className="block text-sm font-normal opacity-80">{m.date} · {m.overs} overs</span></p>
        )}
      </section>
      <div className="sticky top-12 z-10 flex border-b bg-card">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-3 p-4">
        {tab === "Live" && (
          <>
            <div className="rounded-xl bg-card p-4 shadow-card text-sm">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1">
                <span className="text-xs text-muted-foreground">Batter</span><span className="text-xs text-muted-foreground">R</span><span className="text-xs text-muted-foreground">B</span><span className="text-xs text-muted-foreground">SR</span>
                <span className="font-semibold">Ankit Jain *</span><span>18</span><span>11</span><span>163.6</span>
                <span>Mohit Saini</span><span>9</span><span>8</span><span>112.5</span>
              </div>
              <div className="mt-3 border-t pt-3 grid grid-cols-[1fr_auto_auto_auto] gap-x-4">
                <span className="font-semibold">Deepak Joshi</span><span>0.2</span><span>5</span><span>0</span>
              </div>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-card">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">THIS OVER</p>
              <div className="flex gap-2"><BallChip v="1" /><BallChip v="4" /></div>
              <p className="mb-2 mt-3 text-xs font-semibold text-muted-foreground">LAST OVER · 13 runs</p>
              <div className="flex gap-2">{["1","Wd","1lb","0","6","W"].map((v,i)=><BallChip key={i} v={v} />)}</div>
            </div>
            {m.toss && <p className="text-center text-xs text-muted-foreground">{m.toss}</p>}
            <Link to="/scoring/$matchId" params={{ matchId: m.id }} className="block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Open scorer console</Link>
          </>
        )}
        {tab === "Scorecard" && (
          <>
            <div className="overflow-hidden rounded-xl bg-card shadow-card text-sm">
              <div className="bg-secondary px-4 py-2 font-semibold text-secondary-foreground">{m.teamA.name} · 98/4 (10)</div>
              {battingCard.map((p) => (
                <div key={p.name} className="grid grid-cols-[1fr_repeat(4,2rem)] border-t px-4 py-2">
                  <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.how}</p></div>
                  <span className="font-bold">{p.r}</span><span>{p.b}</span><span>{p.f}</span><span>{p.s}</span>
                </div>
              ))}
              <div className="border-t px-4 py-2 text-xs text-muted-foreground">Extras 6 (w 4, lb 2)</div>
            </div>
            <div className="overflow-hidden rounded-xl bg-card shadow-card text-sm">
              <div className="grid grid-cols-[1fr_repeat(4,2rem)] bg-secondary px-4 py-2 font-semibold text-secondary-foreground"><span>Bowler</span><span>O</span><span>M</span><span>R</span><span>W</span></div>
              {bowlingCard.map((p) => (
                <div key={p.name} className="grid grid-cols-[1fr_repeat(4,2rem)] border-t px-4 py-2">
                  <span className="font-medium">{p.name}</span><span>{p.o}</span><span>{p.m}</span><span>{p.r}</span><span className="font-bold">{p.w}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "Commentary" && commentary.map((c) => (
          <div key={c.ball} className="flex gap-3 rounded-xl bg-card p-3 shadow-card">
            <div className="flex flex-col items-center gap-1"><span className="text-xs font-bold text-muted-foreground">{c.ball}</span><BallChip v={c.tag} /></div>
            <p className="text-sm">{c.text}</p>
          </div>
        ))}
        {tab === "Squads" && (
          <div className="grid grid-cols-2 gap-3">
            {[m.teamA, m.teamB].map((t) => (
              <div key={t.id} className="rounded-xl bg-card p-3 shadow-card">
                <p className="mb-2 font-display text-lg font-bold">{t.short}</p>
                {t.players.map((p) => (
                  <p key={p.id} className="py-1 text-sm">{p.name}{p.name === t.captain && <span className="ml-1 text-xs font-bold text-primary">(C)</span>}<span className="block text-xs text-muted-foreground">{p.role}</span></p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
