import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/draft")({
  head: () => ({ meta: [
    { title: "Player draft — GullyScore" },
    { name: "description", content: "Player draft for Hinjewadi Sports Club." },
  ] }),
  component: Draft,
});

function Draft() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);
  if (loading || !isAdmin) return <AppShell back title="Player draft"><p className="p-6 text-center text-sm text-muted-foreground">Checking admin access…</p></AppShell>;
  return (
    <AppShell back title="Player draft">
      <div className="p-6 text-center">
        <h2 className="font-display text-xl font-bold">No draft data yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Drafting will be available when real matches, teams, and registered players are stored in Firebase.</p>
      </div>
    </AppShell>
  );
}
