import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { AppShell, LiveBadge } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";

type InningsRecord = { team:number; runs:number; wkts:number; legal:number; batterStats?:Record<string,{runs:number;balls:number;fours:number;sixes:number;out:boolean}>; bowlerStats?:Record<string,{runs:number;wickets:number;legal:number}>; balls?:{id:string;label:string;runs:number;legal:boolean;wicket:boolean;batterId?:string;bowlerId?:string}[]; picks?:{playerId:string;name:string;team:0|1|"common"}[] };
type MatchDoc = { title: string; overs: number; teamNames: [string,string]; status: string; stage: string; venue?: string; date?: string; picks?: {playerId:string;name:string;team:0|1|"common"}[]; battingFirst?:0|1; firstInnings?: InningsRecord; tossResult?:string; tossWinner?:0|1 };
type Score = {runs:number;wkts:number;legal:number;balls?:{id:string;label:string;runs:number;legal:boolean;wicket:boolean;batterId?:string;bowlerId?:string}[];batterStats?:Record<string,{runs:number;balls:number;fours:number;sixes:number;out:boolean}>;bowlerStats?:Record<string,{runs:number;wickets:number;legal:number}>;strikerId?:string;nonStrikerId?:string;bowlerId?:string;target?:number};
export const Route = createFileRoute("/match/$matchId")({
  head: () => ({ meta: [{ title: "Match centre — GullyScore" }] }),
  component: MatchPage,
});
function MatchPage() {
  const {matchId}=Route.useParams();
  const { isAdmin } = useAuth();
  const [match,setMatch]=useState<MatchDoc|null>(null);
  const [score,setScore]=useState<Score|null>(null);
  const [selectedInnings,setSelectedInnings]=useState<1|2>(2);
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
  const first=match.firstInnings;
  const currentTeam=(match.battingFirst??0) as 0|1;
  const firstTeam=(first?.team??(currentTeam===0?1:0)) as 0|1;
  const secondTeam=(firstTeam===0?1:0) as 0|1;
  const inningsTeam=selectedInnings===1?(first?.team??(match.battingFirst??0)):currentTeam;
  const inningsRecord=selectedInnings===1?first:null;
  const inningsScore=selectedInnings===1
    ? (first?{runs:first.runs,wkts:first.wkts,legal:first.legal,balls:first.balls,batterStats:first.batterStats,bowlerStats:first.bowlerStats}:null)
    : score;
  const inningsPicks=selectedInnings===1?(first?.picks??match.picks??[]):(match.picks??[]);
  const roster=inningsPicks.filter(p=>p.team===inningsTeam||p.team==="common");
  const bowlingRoster=inningsPicks.filter(p=>p.team!==inningsTeam||p.team==="common");
  const batterStats=inningsScore?.batterStats??{};
  const bowlerStats=inningsScore?.bowlerStats??{};
  return <AppShell back title={match.title}>
    <section className="bg-pitch-gradient px-4 pb-5 pt-2 text-pitch-foreground">
      <div className="flex items-center justify-between text-xs opacity-80"><span>{match.venue??"Hinjewadi Sports Club"}</span>{match.status==="live"&&<LiveBadge/>}</div>
      <p className="mt-3 text-sm opacity-80">{match.teamNames[0]}</p><p className="font-display text-2xl font-bold">vs</p><p className="text-sm opacity-80">{match.teamNames[1]}</p>
      <p className="mt-3 text-xs opacity-80">{match.overs} overs · {match.status.toUpperCase()}</p>
      {first&&<div className="mt-3 rounded-lg bg-white/10 p-3"><p className="text-xs opacity-80">{match.teamNames[firstTeam]} · 1st innings</p><p className="font-display text-2xl font-bold">{first.runs}/{first.wkts} <span className="text-base font-normal">({Math.floor(first.legal/6)}.{first.legal%6})</span></p></div>}{score&&<div className="mt-3 rounded-lg bg-white/10 p-3"><p className="text-xs opacity-80">{match.teamNames[secondTeam]} · {first?"2nd innings":"Current innings"}</p><p className="font-display text-4xl font-bold">{score.runs}/{score.wkts} <span className="text-lg font-normal">({Math.floor(score.legal/6)}.{score.legal%6})</span></p></div>}
      {match.tossResult&&<p className="mt-2 text-sm">Toss: {match.tossResult} · {match.teamNames[match.tossWinner??0]} won</p>}
    </section>
    <div className="space-y-3 p-4">
      {match.status==="live"&&<Link to="/scoring/$matchId" params={{matchId}} className="block rounded-xl bg-primary py-3 text-center font-semibold text-primary-foreground">Open scorer console</Link>}
      {isAdmin && <button onClick={()=>void removeMatch()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 font-semibold text-destructive"><Trash2 className="h-4 w-4"/>Delete match</button>}
      <div className="rounded-xl bg-card p-4 shadow-card"><div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1"><button onClick={()=>setSelectedInnings(1)} className={"rounded-lg py-2 text-sm font-semibold "+(selectedInnings===1?"bg-background shadow":"text-muted-foreground")}>1st Innings</button><button onClick={()=>setSelectedInnings(2)} className={"rounded-lg py-2 text-sm font-semibold "+(selectedInnings===2?"bg-background shadow":"text-muted-foreground")}>2nd Innings</button></div><p className="mb-3 text-sm font-semibold">{match.teamNames[inningsTeam]} · {inningsScore?`${inningsScore.runs}/${inningsScore.wkts} (${Math.floor(inningsScore.legal/6)}.${inningsScore.legal%6} overs)`:"Scorecard not available"}</p><h2 className="font-display text-lg font-bold">Batting</h2>{roster.map((p,i)=>{const st=batterStats[p.playerId];return <div key={i} className="flex justify-between gap-2 border-t py-2 text-sm"><span>{p.name}{selectedInnings===2&&score?.strikerId===p.playerId?" *":""}</span><span className="text-right">{st?`${st.runs} (${st.balls}) · 4s ${st.fours} · 6s ${st.sixes}`:"—"}</span></div>})}<h2 className="mt-4 font-display text-lg font-bold">Bowling</h2>{bowlingRoster.map(p=>{const st=bowlerStats[p.playerId]??{runs:0,wickets:0,legal:0};return <div key={p.playerId} className="flex justify-between gap-3 border-t py-2 text-sm"><span>{p.name}{selectedInnings===2&&score?.bowlerId===p.playerId?" *":""}</span><span className="text-right">{Math.floor(st.legal/6)}.{st.legal%6} ov · {st.runs} runs · {st.wickets} wkts</span></div>})}{!bowlingRoster.some(p=>{const st=bowlerStats[p.playerId];return !!st&&(st.legal>0||st.runs>0||st.wickets>0)})&&<p className="mt-2 text-sm text-muted-foreground">No bowling figures recorded for this innings.</p>}</div>
      <div className="rounded-xl bg-card p-4 shadow-card"><h2 className="font-display text-lg font-bold">Recent deliveries</h2>{(score?.balls??[]).slice(-12).reverse().map((b,i)=><div key={b.id??i} className="flex justify-between border-t py-2 text-sm"><span>{b.label} · {b.batterId?roster.find(p=>p.playerId===b.batterId)?.name??"Batter": "Delivery"}</span><span>{b.wicket?"Wicket":b.runs+" run(s)"}</span></div>)}{!score?.balls?.length&&<p className="mt-2 text-sm text-muted-foreground">No deliveries scored yet.</p>}</div>
    </div>
  </AppShell>;
}
