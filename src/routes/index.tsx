import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, orderBy, writeBatch } from "firebase/firestore";
import { MapPin, Trash2 } from "lucide-react";
import { AppShell, LiveBadge } from "@/components/AppShell";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

type Status = "live" | "upcoming" | "completed";
type Match = { id: string; title: string; venue?: string; date?: string; status: Status; overs: number; teamNames: [string,string]; battingFirst?: 0|1 };
type LiveScore = { runs: number; wkts: number; legal: number; updatedAt?: number };
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "GullyScore — Hinjewadi Sports Club" }, { name: "description", content: "Live cricket scores and match management for Hinjewadi Sports Club." }] }),
  component: Index,
});

function MatchCard({match, canDelete, onDelete}: {match:Match; canDelete:boolean; onDelete:(match:Match)=>void}) {
  const [score,setScore]=useState<LiveScore|null>(null);
  useEffect(()=>{if(!db)return;return onSnapshot(doc(db,"matchScores",match.id),s=>setScore(s.exists()?s.data() as LiveScore:null));},[match.id]);
  return <div className="rounded-xl bg-card p-4 shadow-card"><Link to="/match/$matchId" params={{matchId:match.id}} className="block">
    <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span className="font-medium">{match.title}</span>{match.status==="live"?<LiveBadge/>:<span className="capitalize">{match.status}</span>}</div>
    <div className="space-y-2">{match.teamNames.map((name,i)=><div key={i} className="flex items-center justify-between"><span className="font-semibold">{name}</span>{score&&match.status==="live"&&i===(match.battingFirst??0)&&<span className="font-display text-lg font-bold">{score.runs}/{score.wkts} <span className="text-xs font-normal text-muted-foreground">({Math.floor(score.legal/6)}.{score.legal%6})</span></span>}</div>)}</div>
    <p className="mt-2 text-xs text-muted-foreground">{match.overs} overs{match.venue ? " · "+match.venue : ""}{match.date ? " · "+match.date : ""}</p>
    <p className="mt-2 text-sm text-primary">{match.status==="live"?"View live score":match.status==="completed"?"View match":"Match setup"}</p>
  </Link>
  {canDelete && <button type="button" onClick={() => onDelete(match)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive"><Trash2 className="h-4 w-4"/>Delete match</button>}
  </div>;
}
function Index() {
  const { isAdmin } = useAuth();
  const [tab,setTab]=useState<Status>("live");
  const [matches,setMatches]=useState<Match[]>([]);
  const [error,setError]=useState("");
  useEffect(()=>{
    if(!db){setError("Firebase is not configured. Add the FIREBASE_* project secrets in Lovable.");return;}
    return onSnapshot(query(collection(db,"matches"),orderBy("createdAt","desc")),s=>{
      setMatches(s.docs.map(d=>({id:d.id,...(d.data() as Omit<Match,"id">)})));
      setError("");
    },e=>setError(e.message));
  },[]);
  const list=matches.filter(m=>m.status===tab);
  async function deleteMatch(match: Match) {
    if (!db || !isAdmin) return;
    if (!window.confirm(`Delete "${match.title}" and its saved score? This cannot be undone.`)) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "matches", match.id));
      batch.delete(doc(db, "matchScores", match.id));
      await batch.commit();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete match."); }
  }
  return <AppShell>
    <div className="bg-pitch-gradient px-4 pb-4 text-pitch-foreground">
      <p className="text-xs opacity-80">HINJEWADI SPORTS CLUB</p><h1 className="font-display text-3xl font-bold">Match centre</h1>
      <p className="mb-4 text-sm opacity-80">Real matches and live scores</p>
      <div className="flex gap-1 rounded-lg bg-pitch-foreground/10 p-1">{(["live","upcoming","completed"] as Status[]).map(s=><button key={s} onClick={()=>setTab(s)} className={"flex-1 rounded-md py-1.5 text-sm font-semibold capitalize transition "+(tab===s?"bg-card text-foreground":"")}>{s}</button>)}</div>
    </div>
    <div className="space-y-3 p-4">
      {error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {list.map(m=><MatchCard key={m.id} match={m} canDelete={isAdmin} onDelete={deleteMatch}/>)}
      {!error&&!list.length&&<div className="rounded-xl border border-dashed p-6 text-center"><MapPin className="mx-auto mb-2 h-6 w-6 text-muted-foreground"/><p className="font-semibold">No {tab} matches</p><p className="mt-1 text-sm text-muted-foreground">Admin-created matches will appear here.</p></div>}
    </div>
  </AppShell>;
}
