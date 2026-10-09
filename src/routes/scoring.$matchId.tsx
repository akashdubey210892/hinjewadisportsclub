import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { AppShell, BallChip } from "@/components/AppShell";
import { getMatch } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/scoring/$matchId")({
  head: () => ({ meta: [{ title: "Scorer console — GullyScore" }] }),
  component: Scoring,
});

type Ball = { id: string; label: string; runs: number; legal: boolean; wicket: boolean; kind: string; createdAt: number };
type ScoreState = { runs: number; wkts: number; legal: number; balls: Ball[]; target: number; updatedAt: number };

function initialScore(matchId: string, target: number): ScoreState {
  return { runs: matchId === "m1" ? 61 : 0, wkts: matchId === "m1" ? 3 : 0, legal: matchId === "m1" ? 38 : 0, balls: [], target, updatedAt: Date.now() };
}

function Scoring() {
  const { matchId } = Route.useParams();
  const m = getMatch(matchId);
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [score, setScore] = useState<ScoreState>(() => initialScore(matchId, 99));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const target = score.target || 99;
  const runs = score.runs;
  const wkts = score.wkts;
  const legal = score.legal;
  const balls = score.balls;
  const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
  const crr = legal ? (runs / (legal / 6)).toFixed(2) : "0.00";
  const ballsLeft = Math.max(m.overs * 6 - legal, 0);
  const rrr = ballsLeft ? (Math.max(target - runs, 0) / (ballsLeft / 6)).toFixed(2) : "—";

  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || !db) { setReady(true); return; }
    return onSnapshot(doc(db, "matchScores", matchId), (snapshot) => {
      if (snapshot.exists()) setScore(snapshot.data() as ScoreState);
      setReady(true);
    }, (e) => { setMessage(`Could not load live score: ${e.message}`); setReady(true); });
  }, [isAdmin, matchId]);

  const persist = async (next: ScoreState) => {
    if (!db) { setMessage("Firebase is not configured. Score was not saved."); return; }
    setSaving(true);
    setMessage("");
    try {
      await setDoc(doc(db, "matchScores", matchId), { ...next, updatedAt: Date.now() });
      setScore({ ...next, updatedAt: Date.now() });
      setMessage("Score saved");
    } catch (e) {
      setMessage(e instanceof Error ? `Unable to save score: ${e.message}` : "Unable to save score.");
    } finally { setSaving(false); }
  };

  const add = (event: Omit<Ball, "id" | "createdAt">) => {
    if (saving || !isAdmin) return;
    const ball: Ball = { ...event, id: crypto.randomUUID(), createdAt: Date.now() };
    void persist({
      ...score,
      runs: score.runs + ball.runs,
      wkts: score.wkts + (ball.wicket ? 1 : 0),
      legal: score.legal + (ball.legal ? 1 : 0),
      balls: [...score.balls, ball],
    });
  };

  const undo = () => {
    if (!balls.length || saving) return;
    const last = balls[balls.length - 1]!;
    void persist({
      ...score,
      runs: Math.max(0, score.runs - last.runs),
      wkts: Math.max(0, score.wkts - (last.wicket ? 1 : 0)),
      legal: Math.max(0, score.legal - (last.legal ? 1 : 0)),
      balls: balls.slice(0, -1),
    });
  };

  if (loading || !isAdmin) return <AppShell back title="Scorer"><p className="p-6 text-center text-sm text-muted-foreground">Checking admin access…</p></AppShell>;

  return (
    <AppShell back title="Scorer">
      <section className="bg-pitch-gradient px-4 pb-5 text-pitch-foreground">
        <p className="text-xs opacity-80">{m.teamB.name} · Target {target}</p>
        <p className="font-display text-5xl font-bold">{runs}/{wkts} <span className="text-xl font-normal opacity-80">({overs})</span></p>
        <p className="text-sm text-accent">Need {Math.max(target - runs, 0)} off {ballsLeft} balls</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{balls.slice(-8).map((b) => <BallChip key={b.id} v={b.label} />)}</div>
      </section>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-3 text-center shadow-card">
          <div><p className="text-xs text-muted-foreground">CRR</p><p className="font-display text-xl font-bold">{crr}</p></div>
          <div><p className="text-xs text-muted-foreground">RRR</p><p className="font-display text-xl font-bold">{rrr}</p></div>
          <div><p className="text-xs text-muted-foreground">Overs</p><p className="font-display text-xl font-bold">{overs}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 6].map((r) => <button key={r} disabled={saving} onClick={() => add({ label: String(r), runs: r, legal: true, wicket: false, kind: "runs" })} className={`h-16 rounded-xl font-display text-2xl font-bold shadow-card disabled:opacity-50 ${r === 4 ? "bg-four text-primary-foreground" : r === 6 ? "bg-six text-primary-foreground" : "bg-card"}`}>{r}</button>)}
          <button disabled={saving} onClick={() => add({ label: "W", runs: 0, legal: true, wicket: true, kind: "wicket" })} className="col-span-3 h-14 rounded-xl bg-wicket font-display text-xl font-bold text-destructive-foreground disabled:opacity-50">WICKET</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Wd", runs: 1, legal: false, kind: "wide" },
            { label: "Nb", runs: 1, legal: false, kind: "no-ball" },
            { label: "B", runs: 1, legal: true, kind: "bye" },
            { label: "Lb", runs: 1, legal: true, kind: "leg-bye" },
          ].map((e) => <button key={e.label} disabled={saving} onClick={() => add({ ...e, wicket: false })} className="h-12 rounded-xl bg-secondary font-semibold text-secondary-foreground disabled:opacity-50">{e.label}</button>)}
        </div>
        <button onClick={undo} disabled={!balls.length || saving} className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold disabled:opacity-40"><Undo2 className="h-4 w-4" />Undo last delivery</button>
        {message && <p role="status" className={`rounded-lg p-3 text-sm ${message.startsWith("Unable") || message.startsWith("Could not") || message.startsWith("Firebase") ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>{message}</p>}
        <p className="text-center text-xs text-muted-foreground">{saving ? "Saving to Firebase…" : ready ? "Live score is synchronized with Firestore." : "Connecting to live score…"}</p>
      </div>
    </AppShell>
  );
}
