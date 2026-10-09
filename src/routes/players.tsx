import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { db } from "@/lib/firebase";

type PlayerRecord = { id: string; name: string; mobile?: string; role?: string; createdAt?: number };

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [{ title: "Player management — GullyScore" }] }),
  component: PlayersPage,
});

function PlayersPage() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("All-rounder");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) void navigate({ to: "/login" });
  }, [loading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin || !db) return;
    return onSnapshot(query(collection(db, "players"), orderBy("name")), (snapshot) => {
      setPlayers(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlayerRecord, "id">) })));
    }, (e) => setError(e.message));
  }, [isAdmin]);

  if (loading || !isAdmin) return <AppShell back title="Players"><p className="p-6 text-center text-sm text-muted-foreground">Checking admin access…</p></AppShell>;
  if (!db) return <AppShell back title="Players"><p className="p-6">Firebase is not configured. Add the FIREBASE_* project secrets first.</p></AppShell>;

  function resetForm() { setName(""); setMobile(""); setRole("All-rounder"); setEditing(null); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const cleanName = name.trim();
    if (!cleanName) return;
    if (players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase() && p.id !== editing)) {
      setError("A player with this name already exists.");
      return;
    }
    setBusy(true);
    try {
      const data = { name: cleanName, mobile: mobile.trim(), role, updatedAt: Date.now() };
      if (editing) await updateDoc(doc(db, "players", editing), data);
      else await addDoc(collection(db, "players"), { ...data, createdAt: Date.now() });
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save player.");
    } finally { setBusy(false); }
  }

  async function remove(player: PlayerRecord) {
    if (!confirm(`Delete ${player.name} from the player directory?`)) return;
    try { await deleteDoc(doc(db!, "players", player.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to delete player."); }
  }

  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <AppShell back title="Players">
      <section className="bg-pitch-gradient px-4 pb-4 text-pitch-foreground">
        <p className="text-xs opacity-80">ADMIN CONSOLE</p>
        <h1 className="font-display text-3xl font-bold">Player management</h1>
        <p className="text-sm opacity-80">{players.length} registered players</p>
      </section>
      <div className="space-y-4 p-4">
        <form onSubmit={save} className="space-y-3 rounded-xl bg-card p-4 shadow-card">
          <h2 className="font-display text-xl font-bold">{editing ? "Edit player" : "Add a player"}</h2>
          <div><label htmlFor="player-name" className="mb-1 block text-sm font-medium">Player name *</label><input id="player-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="w-full rounded-lg border bg-background px-3 py-2.5" placeholder="Enter full name" /></div>
          <div><label htmlFor="player-mobile" className="mb-1 block text-sm font-medium">Mobile number (optional)</label><input id="player-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} type="tel" maxLength={20} className="w-full rounded-lg border bg-background px-3 py-2.5" placeholder="Mobile number" /></div>
          <div><label htmlFor="player-role" className="mb-1 block text-sm font-medium">Playing role</label><select id="player-role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5">{["Batter", "Bowler", "All-rounder", "WK"].map((r) => <option key={r}>{r}</option>)}</select></div>
          {error && <p role="alert" className="break-words rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <div className="flex gap-2"><button disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? "Saving…" : editing ? "Save changes" : "Add player"}</button>{editing && <button type="button" onClick={resetForm} className="rounded-lg border px-3 py-2.5"><X className="h-4 w-4" /></button>}</div>
        </form>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Search players" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent py-3 outline-none" placeholder="Search players" /></div>
        <div className="space-y-2">
          {filtered.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 shadow-card"><div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.role ?? "All-rounder"}{p.mobile ? ` · ${p.mobile}` : ""}</p></div><div className="flex shrink-0 gap-1"><button aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p.id); setName(p.name); setMobile(p.mobile ?? ""); setRole(p.role ?? "All-rounder"); setError(""); }} className="rounded-lg p-2 text-primary hover:bg-primary/10"><Pencil className="h-4 w-4" /></button><button aria-label={`Delete ${p.name}`} onClick={() => void remove(p)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button></div></div>)}
          {!filtered.length && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{search ? "No matching players." : "No players yet. Add your first player above."}</p>}
        </div>
      </div>
    </AppShell>
  );
}
