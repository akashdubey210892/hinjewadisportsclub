import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";

type Player = { id: string; name: string; role?: string };
type DraftPick = { playerId: string; name: string; team: 0 | 1 | "common" };
type MatchSetup = {
  title: string; overs: number; teamNames: [string, string];
  captains: [string, string]; picks: DraftPick[]; stage: "draft" | "toss" | "ready" | "live";
  tossCall?: "Heads" | "Tails"; tossResult?: "Heads" | "Tails";
  battingFirst?: 0 | 1; createdAt: unknown; status: "upcoming" | "live" | "completed";
};

export const Route = createFileRoute("/draft")({
  head: () => ({ meta: [{ title: "Create match — GullyScore" }] }),
  component: CreateMatch,
});

function CreateMatch() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [title, setTitle] = useState("");
  const [overs, setOvers] = useState(10);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [captainA, setCaptainA] = useState("");
  const [captainB, setCaptainB] = useState("");
  const [matchId, setMatchId] = useState("");
  const [match, setMatch] = useState<MatchSetup | null>(null);
  const [call, setCall] = useState<"Heads" | "Tails">("Heads");
  const [toss, setToss] = useState<"Heads" | "Tails" | null>(null);
  const [choice, setChoice] = useState<"Bat" | "Bowl" | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin || !db) return;
    return onSnapshot(query(collection(db, "players"), orderBy("name")), s =>
      setPlayers(s.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Player, "id">) }))),
      e => setError(e.message));
  }, [isAdmin]);
  useEffect(() => {
    if (!db || !matchId) return;
    return onSnapshot(doc(db, "matches", matchId), s => {
      if (s.exists()) setMatch(s.data() as MatchSetup);
    }, e => setError(e.message));
  }, [matchId]);

  const picks = match?.picks ?? [];
  const teamPicks = useMemo(() => [
    picks.filter(p => p.team === 0), picks.filter(p => p.team === 1)
  ], [picks]);
  const currentTeam: 0 | 1 = (picks.length % 2) as 0 | 1;
  const pickedCounts = [teamPicks[0].length, teamPicks[1].length];
  const pickedPlayerIds = new Set(picks.map(p => p.playerId));

  if (loading || !isAdmin) return <AppShell back title="Create match"><p className="p-6 text-center text-sm">Checking admin access…</p></AppShell>;
  if (!db) return <AppShell back title="Create match"><p className="p-6">Configure Firebase first.</p></AppShell>;

  async function createMatch(e: FormEvent) {
    e.preventDefault(); setError("");
    if (!players.length) { setError("Add players in Player Management before creating a match."); return; }
    if (!captainA || !captainB) { setError("Choose a captain for each team."); return; }
    setBusy(true);
    try {
      const setup: MatchSetup = {
        title: title.trim() || teamA.trim() + " vs " + teamB.trim(),
        overs, teamNames: [teamA.trim(), teamB.trim()], captains: [captainA, captainB],
        picks: [], stage: "draft", createdAt: serverTimestamp(), status: "upcoming"
      };
      const ref = await addDoc(collection(db, "matches"), setup);
      setMatchId(ref.id); setMatch(setup);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create match."); }
    finally { setBusy(false); }
  }

  async function addPick(player: Player) {
    if (!match || !matchId || busy) return;
    setBusy(true); setError("");
    try {
      const next = [...picks, { playerId: player.id, name: player.name, team: currentTeam }];
      await updateDoc(doc(db!, "matches", matchId), { picks: next });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save pick."); }
    finally { setBusy(false); }
  }

  async function removePick(playerId: string) {\n    if (!matchId || busy) return;\n    setBusy(true); setError("");\n    try { await updateDoc(doc(db!, "matches", matchId), { picks: picks.filter(p => p.playerId !== playerId) }); }\n    catch (e) { setError(e instanceof Error ? e.message : "Could not remove player."); }\n    finally { setBusy(false); }\n  }\n\n  async function addCommon(player: Player) {\n    if (!matchId || busy || picks.some(p => p.playerId === player.id)) return;\n    setBusy(true); setError("");\n    try { await updateDoc(doc(db!, "matches", matchId), { picks: [...picks, { playerId: player.id, name: player.name, team: "common" }] }); }\n    catch (e) { setError(e instanceof Error ? e.message : "Could not mark player common."); }\n    finally { setBusy(false); }\n  }\n\n  async function saveToss() {
    if (!match || !matchId || !toss || !choice) return;
    const tossWinner: 0 | 1 = toss === call ? 0 : 1;
    const battingFirst: 0 | 1 = choice === "Bat" ? tossWinner : (tossWinner === 0 ? 1 : 0);
    setBusy(true); setError("");
    try {
      await updateDoc(doc(db!, "matches", matchId), { tossCall: call, tossResult: toss, tossWinner, battingFirst, stage: "ready" });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save toss."); }
    finally { setBusy(false); }
  }

  async function startMatch() {
    if (!matchId || !match) return;
    setBusy(true); setError("");
    try {
      await updateDoc(doc(db!, "matches", matchId), { stage: "live", status: "live", startedAt: serverTimestamp() });
      await navigate({ to: "/scoring/$matchId", params: { matchId } });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not start match."); }
    finally { setBusy(false); }
  }

  const roster = (team: 0 | 1) => [...teamPicks[team], ...picks.filter(p => p.team === "common")];
  return (
    <AppShell back title="Create match">
      <section className="bg-pitch-gradient px-4 pb-4 text-pitch-foreground">
        <p className="text-xs opacity-80">ADMIN CONSOLE</p>
        <h1 className="font-display text-3xl font-bold">Create match</h1>
        <p className="text-sm opacity-80">Set up teams, draft players, toss, then start scoring.</p>
      </section>
      <div className="space-y-4 p-4">
        {!matchId && <form onSubmit={createMatch} className="space-y-4 rounded-xl bg-card p-4 shadow-card">
          <div><label className="mb-1 block text-sm font-medium">Match name (optional)</label><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" placeholder="Weekend league — Match 1" /></div>
          <div><label className="mb-1 block text-sm font-medium">Overs per innings</label><select value={overs} onChange={e=>setOvers(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2.5">{[5,6,8,10,12,15,20, overs].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b).map(v=><option key={v} value={v}>{v} overs</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium">Team 1 name</label><input required value={teamA} onChange={e=>setTeamA(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" placeholder="Enter team name" /></div>
          <div><label className="mb-1 block text-sm font-medium">Team 1 captain</label><select required value={captainA} onChange={e=>setCaptainA(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5"><option value="">Choose captain</option>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium">Team 2 name</label><input required value={teamB} onChange={e=>setTeamB(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" placeholder="Enter team name" /></div>
          <div><label className="mb-1 block text-sm font-medium">Team 2 captain</label><select required value={captainB} onChange={e=>setCaptainB(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5"><option value="">Choose captain</option>{players.filter(p=>p.id!==captainA).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          {!players.length && <p className="text-sm text-muted-foreground">No registered players found. Add players first in Players.</p>}
          <button disabled={busy || !players.length} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Creating…" : "Create match & start draft"}</button>
        </form>}
        {match && match.stage === "draft" && <>
          <div className="rounded-xl bg-card p-4 shadow-card"><p className="font-display text-xl font-bold">{match.title}</p><p className="text-sm text-muted-foreground">{match.overs} overs · Pick #{picks.length+1}</p><p className="mt-2 font-semibold">{match.teamNames[currentTeam]}'s turn to pick</p><p className="text-xs text-muted-foreground">Captains can select the same player for both teams if desired.</p></div>
          <div className="grid grid-cols-2 gap-3">{([0,1] as const).map(team=><div key={team} className="rounded-xl bg-card p-3 shadow-card"><p className="font-semibold">{match.teamNames[team]}</p><p className="text-xs text-muted-foreground">Captain: {players.find(p=>p.id===match.captains[team])?.name ?? "—"}</p>{roster(team).map(p=><div key={p.playerId} className="mt-1 flex items-center justify-between gap-2 text-sm"><span>{p.name}{p.team === "common" ? " · Common" : ""}</span><button disabled={busy} onClick={() => void removePick(p.playerId)} className="text-xs text-destructive underline">Deselect</button></div>)}</div>)}</div>
          <div className="rounded-xl bg-card p-4 shadow-card"><p className="mb-3 font-semibold">Available players</p><div className="space-y-2">{players.map(p=>{ const picked=pickedPlayerIds.has(p.id); return <div key={p.id} className="flex items-center gap-2 rounded-lg border px-3 py-3"><span className="min-w-0 flex-1">{p.name}<span className="block text-xs text-muted-foreground">{p.role ?? "Player"}</span></span>{picked ? <span className="text-xs text-muted-foreground">Already selected</span> : <><button disabled={busy} onClick={()=>void addPick(p)} className="rounded-md bg-primary px-2 py-2 text-xs font-semibold text-primary-foreground">Pick for {match.teamNames[currentTeam]}</button><button disabled={busy} onClick={()=>void addCommon(p)} className="rounded-md border px-2 py-2 text-xs font-semibold">Common</button></>}</div>})}</div></div>
          <button disabled={busy || !picks.length} onClick={()=>void updateDoc(doc(db!,"matches",matchId),{stage:"toss"})} className="w-full rounded-lg border py-3 font-semibold">Finish draft & go to toss</button>
        </>}
        {match && match.stage === "toss" && <div className="space-y-4 rounded-xl bg-card p-4 shadow-card">
          <h2 className="font-display text-2xl font-bold">Toss</h2><p className="text-sm text-muted-foreground">{match.teamNames[0]} vs {match.teamNames[1]}</p>
          <p className="text-sm font-medium">{players.find(p=>p.id===match.captains[0])?.name} calls</p>
          <div className="flex gap-2">{(["Heads","Tails"] as const).map(v=><button key={v} onClick={()=>setCall(v)} className={`flex-1 rounded-lg py-2 ${call===v?"bg-primary text-primary-foreground":"bg-secondary"}`}>{v}</button>)}</div>
          <button onClick={()=>setToss(Math.random()<.5?"Heads":"Tails")} className="w-full rounded-lg bg-pitch-gradient py-3 font-semibold text-pitch-foreground">Flip coin</button>
          {toss && <><p className="text-center font-display text-2xl font-bold">{toss} — {toss===call?match.teamNames[0]:match.teamNames[1]} won</p><p className="text-sm font-medium">Choose to bat or bowl first</p><div className="flex gap-2">{(["Bat","Bowl"] as const).map(v=><button key={v} onClick={()=>setChoice(v)} className={`flex-1 rounded-lg py-3 font-semibold ${choice===v?"bg-primary text-primary-foreground":"bg-secondary"}`}>{v}</button>)}</div><button disabled={busy||!choice} onClick={()=>void saveToss()} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground">Save toss result</button></>}
        </div>}
        {match && match.stage === "ready" && <div className="space-y-3 rounded-xl bg-card p-4 shadow-card"><h2 className="font-display text-2xl font-bold">Ready to start</h2><p>{match.teamNames[match.battingFirst ?? 0]} will bat first.</p><p className="text-sm text-muted-foreground">{match.overs} overs · {picks.length} player selections recorded</p><button disabled={busy} onClick={()=>void startMatch()} className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground">{busy?"Starting…":"Start match"}</button></div>}
        {error && <p role="alert" className="break-words rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      </div>
    </AppShell>
  );
}
