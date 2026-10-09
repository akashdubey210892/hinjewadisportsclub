import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { AppShell, LiveBadge } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";

type MatchDoc = { title: string; overs: number; teamNames: [string,string]; status: string; stage: string; venue?: string; date?: string; picks?: {playerId:string;name:string;team:0|1}[]; battingFirst?:0|1; tossResult?:string; tossWinner?:0|1 };
type Score = {runs:number;wkts:number;legal:number;balls?:{id:string;label:string;runs:number;legal:boolean;wicket:boolean;batterId?:string}[];batterStats?:Record<string,{runs:number;balls:number;fours:number;sixes:number;out:boolean}>;strikerId?:string;nonStrikerId?:string;bowlerId?:string};
export const Route = createFileRoute("/match/$matchId")({
  head: () => ({ meta: [{ title: "Match centre — GullyScore" }] }),
  component: MatchPage,
});
function MatchPage() {
  const {matchId}=Route.useParams();
  const { isAdmin } = useAuth();
  const [match,setMatch]=useState<MatchDoc|null>(null);
  const [score,setScore]=useState<Score|null>(null);
  useEffect(()=>{
    if(!db)return;
    const a=onSnapshot(doc(db,"matches",matchId),s=>setMatch(s.exists()?s.data() as MatchDoc:null));
    const b=onSnapshot(doc(db,"matchScores",matchId),s=>setScore(s.exists()?s.data() as Score:null));
    return ()=>{a();b();};
  },[matchId]);
  if(!match)return <AppShell back title="Match centre"><div className="p-6 text-center"><h2 className="font-display text-xl font-bold">Match not found</h2><p className="mt-2 text-sm text-muted-foreground">This match may have been removed or is not available.</p></div></AppShell>;
  async function removeMatch() {
    if (!db || !isAdmin || !window.confirm(`Delete "${match.title}" and its saved score? This cannot be undone.`)) return;
    try { await deleteDoc(doc(db, "matchScores", matchId)); await deleteDoc(doc(db, "matches", matchId)); window.location.assign("/"); }
    catch (e) { window.alert(e instanceof Error ? e.message : "Could not delete match."); }
  }
  const batting=match.battingFirst??0;
  const roster=(match.picks??[]).filter(p=>p.team===batting);
  return <AppShell back title={match.title}>
    <section className="bg-pitch-gradient px-4 pb-5 pt-2 text-pitch-foreground">
      <div className="flex items-center justify-between text-xs opacity-80"><span>{match.venue??"Hinjewadi Sports Club"}</span>{match.status==="live"&&<LiveBadge/>}</div>
      <p className="mt-3 text-sm opacity-80">{match.teamNames[0]}</p><p className="font-display text-2xl font-bold">vs</p><p className="text-sm opacity-80">{match.teamNames[1]}</p>
      <p className="mt-3 text-xs opacity-80">{match.overs} overs · {match.status.toUpperCase()}</p>
      {score&&<p className="mt-3 font-display text-4xl font-bold">{score.runs}/{score.wkts} <span className="text-lg font-normal">({Math.floor(score.legal/6)}.{score.legal%6})</span></p>}
      {match.tossResult&&<p className="mt-2 text-sm">Toss: {match.tossResult} · {match.teamNames[match.tossWinner??0]} won</p>}
    </section>
    <div className="space-y-3 p-4">
      {match.status==="live"&&<Link to="/scoring/$matchId" params={{matchId}} className="block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Open scorer console</Link>}
      {isAdmin && <button onClick={()=>void removeMatch()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 font-semibold text-destructive"><Trash2 className="h-4 w-4"/>Delete match</button>}
      <div className="rounded-xl bg-card p-4 shadow-card"><h2 className="font-display text-lg font-bold">Batting scorecard</h2>{roster.map((p,i)=>{const st=score?.batterStats?.[p.playerId];return <div key={i} className="flex justify-between border-t py-2 text-sm"><span>{p.name}{score?.strikerId===p.playerId?" *":""}</span><span>{st?st.runs+" ("+st.balls+") · 4s "+st.fours+" · 6s "+st.sixes:"—"}</span></div>})}{!roster.length&&<p className="mt-2 text-sm text-muted-foreground">No player selections recorded.</p>}</div>
      <div className="rounded-xl bg-card p-4 shadow-card"><h2 className="font-display text-lg font-bold">Recent deliveries</h2>{(score?.balls??[]).slice(-12).reverse().map((b,i)=><div key={b.id??i} className="flex justify-between border-t py-2 text-sm"><span>{b.label} · {b.batterId?roster.find(p=>p.playerId===b.batterId)?.name??"Batter": "Delivery"}</span><span>{b.wicket?"Wicket":b.runs+" run(s)"}</span></div>)}{!score?.balls?.length&&<p className="mt-2 text-sm text-muted-foreground">No deliveries scored yet.</p>}</div>
    </div>
  </AppShell>;
}
