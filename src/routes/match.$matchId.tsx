import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getMatch } from "@/lib/data";

export const Route = createFileRoute("/match/$matchId")({
  head: () => ({ meta: [
    { title: "Match centre — GullyScore" },
    { name: "description", content: "Match centre for Hinjewadi Sports Club." },
  ] }),
  component: MatchPage,
});

function MatchPage() {
  const m = getMatch(Route.useParams().matchId);
  if (!m) {
    return (
      <AppShell back title="Match centre">
        <div className="p-6 text-center">
          <h2 className="font-display text-xl font-bold">Match not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This match is not available yet. No sample scorecards or commentary are shown.</p>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell back title={m.title}>
      <div className="p-6 text-center">
        <h2 className="font-display text-xl font-bold">{m.teamA.name} vs {m.teamB.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{m.venue} · {m.date}</p>
        <p className="mt-4 text-sm text-muted-foreground">Scorecard and commentary will appear when this match has real scoring data.</p>
      </div>
    </AppShell>
  );
}
