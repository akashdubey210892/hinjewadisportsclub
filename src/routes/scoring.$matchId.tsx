import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Undo2, ArrowLeftRight } from "lucide-react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { AppShell, BallChip } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/scoring/$matchId")({
  head: () => ({ meta: [{ title: "Scorer console — GullyScore" }] }),
  component: Scoring,
});

type Player = { id: string; name: string; role?: string };
type Pick = { playerId: string; name: string; team: 0 | 1 | "common" };
type MatchDoc = { title: string; overs: number; teamNames: [string,string]; picks: Pick[]; battingFirst?: 0 | 1; stage: string; status: string };
type Ball = { id: string; label: string; runs: number; legal: boolean; wicket: boolean; kind: string; batterId?: string; bowlerId?: string; createdAt: number };
type BatterStats = { runs: number; balls: number; fours: number; sixes: number; out: boolean };
type ScoreState = { runs: number; wkts: number; legal: number; balls: Ball[]; target: number; updatedAt: number; strikerId: string; nonStrikerId: string; bowlerId: string; batterStats: Record<string,BatterStats> };

const blankStats = (): BatterStats => ({ runs: 0, balls: 0, fours: 0, sixes: 0, out: false });
const emptyScore = (): ScoreState => ({ runs: 0, wkts: 0, legal: 0, balls: [], target: 0, updatedAt: Date.now(), strikerId: "", nonStrikerId: "", bowlerId: "", batterStats: {} });

function Scoring() {
  const { matchId } = Route.useParams();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [score, setScore] = useState<ScoreState>(emptyScore);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [manualStrike, setManualStrike] = useState(false);
  const [showNextBowler, setShowNextBowler] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState("");
  const [showNewBatter, setShowNewBatter] = useState(false);
  const [newBatterId, setNewBatterId] = useState("");
  const [newPlayerId, setNewPlayerId] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState<0 | 1>(0);

  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin || !db) return;
    const unsubMatch = onSnapshot(doc(db, "matches", matchId), s => setMatch(s.exists() ? s.data() as MatchDoc : null), e=>setMessage(e.message));
    const unsubPlayers = onSnapshot(collection(db,"players"),s=>setPlayers(s.docs.map(d=>({id:d.id,...(d.data() as Omit<Player,"id">)}))));
    const unsubScore = onSnapshot(doc(db, "matchScores", matchId), s => {
      if (s.exists()) setScore({ ...emptyScore(), ...(s.data() as Partial<ScoreState>) });
      else setScore(emptyScore());
      setReady(true);
    }, e => { setMessage(`Could not load live score: ${e.message}`); setReady(true); });
    return () => { unsubMatch(); unsubPlayers(); unsubScore(); };
  }, [isAdmin, matchId]);

  const battingTeam = match?.battingFirst ?? 0;
  const battingRoster = useMemo(() => (match?.picks ?? []).filter(p=>p.team===battingTeam || p.team==="common"), [match,battingTeam]);
  const bowlingRoster = useMemo(() => (match?.picks ?? []).filter(p=>p.team!==(battingTeam) || p.team==="common"), [match,battingTeam]);
  const selectedPlayer = (id: string) => players.find(p=>p.id===id)?.name ?? match?.picks.find(p=>p.playerId===id)?.name ?? "Select player";
  const target = score.target;
  const runs = score.runs;
  const wkts = score.wkts;
  const legal = score.legal;
  const balls = score.balls ?? [];
  const overs = `${Math.floor(legal / 6)}.${legal % 6}`;
  const crr = legal ? (runs / (legal / 6)).toFixed(2) : "0.00";
  const ballsLeft = match ? Math.max(match.overs * 6 - legal, 0) : 0;
  const rrr = target > 0 && ballsLeft ? (Math.max(target - runs, 0) / (ballsLeft / 6)).toFixed(2) : "—";

  const persist = async (next: ScoreState) => {
    if (!db) { setMessage("Firebase is not configured. Score was not saved."); return; }
    setSaving(true); setMessage("");
    try {
      await setDoc(doc(db,"matchScores",matchId),{...next,updatedAt:Date.now()});
      setScore({...next,updatedAt:Date.now()}); setMessage("Score saved");
    } catch(e) { setMessage(e instanceof Error ? `Unable to save score: ${e.message}` : "Unable to save score."); }
    finally { setSaving(false); }
  };

  const add = (event: Omit<Ball,"id"|"createdAt">) => {
    if (saving || !isAdmin || showNextBowler) return;
    if (!score.strikerId || !score.bowlerId) { setMessage("Select the striker and bowler before scoring."); return; }
    const ball: Ball = {...event,id:crypto.randomUUID(),createdAt:Date.now(),batterId:score.strikerId,bowlerId:score.bowlerId};
    const stats = {...score.batterStats};
    const current = {...(stats[score.strikerId] ?? blankStats())};
    if (event.kind === "runs") { current.runs += event.runs; current.balls += 1; if(event.runs===4) current.fours++; if(event.runs===6) current.sixes++; }
    else if (event.legal && event.kind !== "bye" && event.kind !== "leg-bye") current.balls += 1;
    if(event.wicket) current.out=true;
    stats[score.strikerId]=current;
    const nextLegal=score.legal+(event.legal?1:0);
    const rotate=event.kind==="runs" ? event.runs%2===1 : (event.kind==="bye"||event.kind==="leg-bye") && event.runs%2===1;
    let strikerId=rotate?score.nonStrikerId:score.strikerId;
    let nonStrikerId=rotate?score.strikerId:score.nonStrikerId;
    if(event.wicket) { strikerId=score.nonStrikerId; setManualStrike(true); }
    const overFinished = event.legal && nextLegal > 0 && nextLegal % 6 === 0;
    if(overFinished) { const old=strikerId; strikerId=nonStrikerId; nonStrikerId=old; }
    const nextScore = {...score,runs:score.runs+event.runs,wkts:score.wkts+(event.wicket?1:0),legal:nextLegal,balls:[...balls,ball],batterStats:stats,strikerId,nonStrikerId,bowlerId:overFinished ? "" : score.bowlerId};
    void persist(nextScore);
    if(event.wicket && nextScore.wkts < 10 && nextLegal < (match?.overs ?? 0) * 6) { setNewBatterId(""); setShowNewBatter(true); }
    if(overFinished && nextLegal < (match?.overs ?? 0) * 6 && nextScore.wkts < 10) {
      setNextBowlerId("");
      setShowNextBowler(true);
    }
  };

  async function addPlayerToTeam() {
    if (!db || !match || !newPlayerId || saving) return;
    const player = players.find(p => p.id === newPlayerId);
    if (!player) return;
    const picks = match.picks ?? [];
    if (picks.some(p => p.playerId === player.id && (p.team === newPlayerTeam || p.team === "common"))) { setMessage("Player is already in that team."); return; }
    setSaving(true);
    try {
      const nextPicks = [...picks, { playerId: player.id, name: player.name, team: newPlayerTeam }];
      await setDoc(doc(db, "matches", matchId), { picks: nextPicks }, { merge: true });
      setMatch({ ...match, picks: nextPicks }); setNewPlayerId(""); setMessage(`${player.name} added to ${match.teamNames[newPlayerTeam]}.`);
    } catch(e) { setMessage(e instanceof Error ? e.message : "Could not add player."); }
    finally { setSaving(false); }
  }

  const undo = () => {
    if (!balls.length || saving) return;
    // Rebuild totals and batter figures from remaining deliveries to keep the scorecard consistent.
    const remaining=balls.slice(0,-1);
    const next=emptyScore();
    next.target=score.target; next.strikerId=score.strikerId; next.nonStrikerId=score.nonStrikerId; next.bowlerId=score.bowlerId;
    for(const b of remaining) {
      next.runs+=b.runs; next.wkts+=b.wicket?1:0; next.legal+=b.legal?1:0;
      if(b.batterId) { const st={...(next.batterStats[b.batterId]??blankStats())}; if(b.kind==="runs"){st.runs+=b.runs;st.balls++;if(b.runs===4)st.fours++;if(b.runs===6)st.sixes++;} else if(b.legal&&b.kind!=="bye"&&b.kind!=="leg-bye") st.balls++; if(b.wicket)st.out=true;next.batterStats[b.batterId]=st; }
    }
    next.balls=remaining; void persist(next);
  };

  if (loading || !isAdmin) return <AppShell back title="Scorer"><p className="p-6 text-center text-sm">Checking admin access…</p></AppShell>;
  if (!match) return <AppShell back title="Scorer"><div className="p-6 text-center"><p className="font-semibold">Match not found</p><p className="mt-2 text-sm text-muted-foreground">Create a match first.</p></div></AppShell>;

  const choose = (field: "strikerId"|"nonStrikerId"|"bowlerId", value: string) => void persist({...score,[field]:value});
  const swapStrike = () => { if (!score.strikerId || !score.nonStrikerId || saving) return; void persist({...score,strikerId:score.nonStrikerId,nonStrikerId:score.strikerId}); };
  const chooseNextBowler = async () => { if (!nextBowlerId) return; await persist({...score,bowlerId:nextBowlerId}); setShowNextBowler(false); };
  const chooseNewBatter = async () => {
    if (!newBatterId || saving) return;
    const updated = { ...score, strikerId: newBatterId, nonStrikerId: score.nonStrikerId };
    await persist(updated);
    setShowNewBatter(false);
    setManualStrike(false);
  };
  return (
    <AppShell back title="Scorer">
      <section className="bg-pitch-gradient px-4 pb-5 text-pitch-foreground">
        <p className="text-xs opacity-80">{match.teamNames[battingTeam]} batting · {match.overs} overs</p>
        <p className="font-display text-5xl font-bold">{runs}/{wkts} <span className="text-xl font-normal opacity-80">({overs})</span></p>
        {target>0 && <p className="text-sm text-accent">Need {Math.max(target-runs,0)} off {ballsLeft} balls</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">{balls.slice(-8).map(b=><BallChip key={b.id} v={b.label}/>)}</div>
      </section>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-3 text-center shadow-card"><div><p className="text-xs text-muted-foreground">CRR</p><p className="font-display text-xl font-bold">{crr}</p></div><div><p className="text-xs text-muted-foreground">RRR</p><p className="font-display text-xl font-bold">{rrr}</p></div><div><p className="text-xs text-muted-foreground">Overs</p><p className="font-display text-xl font-bold">{overs}</p></div></div>
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-card">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="rounded-lg bg-secondary p-3"><p className="text-xs text-muted-foreground">Striker</p><p className="font-semibold">{score.strikerId ? selectedPlayer(score.strikerId) : "Not selected"}</p></div><button type="button" title="Swap striker and non-striker" aria-label="Swap striker and non-striker" disabled={!score.strikerId || !score.nonStrikerId || saving} onClick={swapStrike} className="rounded-full border p-3 disabled:opacity-40"><ArrowLeftRight className="h-5 w-5"/></button><div className="rounded-lg bg-secondary p-3"><p className="text-xs text-muted-foreground">Non-striker</p><p className="font-semibold">{score.nonStrikerId ? selectedPlayer(score.nonStrikerId) : "Not selected"}</p></div></div>
          <div><label className="mb-1 block text-sm font-medium">Bowler</label><select value={score.bowlerId} onChange={e=>choose("bowlerId",e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5"><option value="">Select bowler</option>{bowlingRoster.map((p,i)=><option key={i} value={p.playerId} disabled={p.playerId===score.strikerId || p.playerId===score.nonStrikerId}>{p.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2 text-sm"><div className="rounded-lg bg-secondary p-3"><p className="text-muted-foreground">On strike</p><p className="font-semibold">{score.strikerId?selectedPlayer(score.strikerId):"Not selected"}</p></div><div className="rounded-lg bg-secondary p-3"><p className="text-muted-foreground">Bowling</p><p className="font-semibold">{score.bowlerId?selectedPlayer(score.bowlerId):"Not selected"}</p></div></div>
        </div>
        <div className="grid grid-cols-3 gap-2">{[0,1,2,3,4,6].map(r=><button key={r} disabled={saving} onClick={()=>add({label:String(r),runs:r,legal:true,wicket:false,kind:"runs"})} className={`h-16 rounded-xl font-display text-2xl font-bold shadow-card disabled:opacity-50 ${r===4?"bg-four text-primary-foreground":r===6?"bg-six text-primary-foreground":"bg-card"}`}>{r}</button>)}<button disabled={saving} onClick={()=>add({label:"W",runs:0,legal:true,wicket:true,kind:"wicket"})} className="col-span-3 h-14 rounded-xl bg-wicket font-display text-xl font-bold text-destructive-foreground">WICKET</button></div>
        <div className="grid grid-cols-4 gap-2">{[{label:"Wd",runs:1,legal:false,kind:"wide"},{label:"Nb",runs:1,legal:false,kind:"no-ball"},{label:"B",runs:1,legal:true,kind:"bye"},{label:"Lb",runs:1,legal:true,kind:"leg-bye"}].map(e=><button key={e.label} disabled={saving} onClick={()=>add({...e,wicket:false})} className="h-12 rounded-xl bg-secondary font-semibold">{e.label}</button>)}</div>
        <button onClick={()=>setManualStrike(v=>!v)} className="w-full rounded-lg border py-2.5 text-sm font-semibold">{manualStrike?"Hide":"Run out / manual strike correction"}</button>
        {manualStrike && <div className="rounded-xl border p-3"><p className="mb-2 text-sm">Choose who faces the next ball (use after a run out or unusual crossing).</p><div className="flex gap-2"><button onClick={()=>{setManualStrike(false);void persist({...score,strikerId:score.strikerId,nonStrikerId:score.nonStrikerId});}} className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground">Keep current strike</button><button onClick={()=>{setManualStrike(false);void persist({...score,strikerId:score.nonStrikerId,nonStrikerId:score.strikerId});}} className="flex-1 rounded-lg bg-secondary py-2">Swap strike</button></div></div>}
        <div className="space-y-3 rounded-xl bg-card p-4 shadow-card"><h2 className="font-display text-lg font-bold">Add player during match</h2><p className="text-xs text-muted-foreground">For late arrivals, add a registered player to either team. Common players can be selected for both teams in match setup.</p><select value={newPlayerId} onChange={e=>setNewPlayerId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5"><option value="">Choose player</option>{players.filter(p=>!(match.picks??[]).some(k=>k.playerId===p.id && k.team!=="common")).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><select value={newPlayerTeam} onChange={e=>setNewPlayerTeam(Number(e.target.value) as 0|1)} className="w-full rounded-lg border bg-background px-3 py-2.5"><option value={0}>{match.teamNames[0]}</option><option value={1}>{match.teamNames[1]}</option></select><button disabled={saving||!newPlayerId} onClick={()=>void addPlayerToTeam()} className="w-full rounded-lg border py-2.5 font-semibold disabled:opacity-50">Add player to team</button></div><div className="rounded-xl bg-card p-4 shadow-card"><h2 className="mb-2 font-display text-lg font-bold">Batting</h2>{battingRoster.map((p,i)=>{const st=score.batterStats[p.playerId]??blankStats();return <div key={i} className="flex justify-between border-t py-2 text-sm"><span>{p.name}{p.playerId===score.strikerId?" *":""}</span><span>{st.runs} ({st.balls}) · 4s {st.fours} · 6s {st.sixes}</span></div>})}</div>
        <button onClick={undo} disabled={!balls.length||saving} className="flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold disabled:opacity-40"><Undo2 className="h-4 w-4"/>Undo last delivery</button>
        {showNewBatter && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-5 shadow-xl"><h2 className="font-display text-2xl font-bold">Wicket! New batter</h2><p className="text-sm text-muted-foreground">Select the incoming batter to face the next delivery.</p><select value={newBatterId} onChange={e=>setNewBatterId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3"><option value="">Choose new batter</option>{battingRoster.filter(p=>p.playerId!==score.strikerId && p.playerId!==score.nonStrikerId && !score.batterStats[p.playerId]?.out).map(p=><option key={p.playerId} value={p.playerId}>{p.name}</option>)}</select><button disabled={!newBatterId||saving} onClick={()=>void chooseNewBatter()} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground">Confirm new batter</button></div></div>}
        {showNextBowler && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-5 shadow-xl"><h2 className="font-display text-2xl font-bold">Over complete</h2><p className="text-sm text-muted-foreground">Strike has changed. Choose the next bowler to continue.</p><select value={nextBowlerId} onChange={e=>setNextBowlerId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-3"><option value="">Choose next bowler</option>{bowlingRoster.filter(p=>p.playerId!==score.bowlerId).map(p=><option key={p.playerId} value={p.playerId} disabled={p.playerId===score.strikerId || p.playerId===score.nonStrikerId}>{p.name}{p.playerId===score.strikerId || p.playerId===score.nonStrikerId ? " (batting)" : ""}</option>)}</select><button disabled={!nextBowlerId||saving} onClick={()=>void chooseNextBowler()} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground">Confirm bowler</button></div></div>}
        {message && <p role="status" className="break-words rounded-lg bg-secondary p-3 text-sm">{message}</p>}
        <p className="text-center text-xs text-muted-foreground">{saving?"Saving to Firebase…":ready?"Live score is synchronized with Firestore.":"Connecting to live score…"}</p>
      </div>
    </AppShell>
  );
}
