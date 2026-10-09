import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/draft")({
  head: () => ({ meta: [
    { title: "Player draft — GullyScore" },
    { name: "description", content: "Captains pick players in turn from the match pool." },
  ] }),
  component: Draft,
});

const pool = ["Arjun Mehta","Karan Gupta","Nikhil Rao","Pranav Iyer","Suresh Kumar","Ravi Shukla","Gaurav Mishra","Harsh Pandey","Yash Chauhan","Ankit Jain","Mohit Saini","Tarun Bhatt","Varun Nair","Vikas Yadav"];
const caps = [{ name: "Rahul Verma", team: "Lions" }, { name: "Manish Tiwari", team: "Strikers" }];

function Draft() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [picks] = useState<{ player: string; team: number }[]>([]);
  useEffect(() => { if (!loading && !isAdmin) void navigate({ to: "/login" }); }, [loading, isAdmin, navigate]);
  if (loading || !isAdmin) return <AppShell back title="Player draft"><p className="p-6 text-center text-sm text-muted-foreground">Checking admin access…</p></AppShell>;
  return (
    <AppShell back title="Player draft">
      <div className="p-6 text-center">
        <h2 className="font-display text-xl font-bold">No draft data yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Drafting will be available when real matches, teams, and registered players are stored in Firebase.</p>
      </div>
    </AppShell>
}
