import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { ADMIN_EMAIL, firebaseConfigured } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin login — GullyScore" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!loading && isAdmin) void navigate({ to: "/" }); }, [loading, isAdmin, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
      await navigate({ to: "/" });
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
      setError(code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")
        ? "Incorrect username or password."
        : e instanceof Error ? e.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell back title="Admin login">
      <main className="px-5 py-8">
        <div className="mx-auto max-w-sm rounded-2xl bg-card p-6 shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="text-center font-display text-3xl font-bold">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Sign in to manage players, draft, toss and scoring.</p>
          {!firebaseConfigured && (
            <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Firebase is not configured yet. Add the FIREBASE_* secrets in Lovable project settings and enable Email/Password sign-in in Firebase Console.
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-semibold">Username</label>
              <input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full rounded-lg border bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder="admin" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label>
              <div className="flex rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none" placeholder="Enter admin password" />
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="px-3 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <button disabled={busy || !firebaseConfigured} className="flex w-full items-center justify-center gap-2 rounded-xl bg-pitch-gradient py-3 font-semibold text-pitch-foreground disabled:cursor-not-allowed disabled:opacity-50">
              <LockKeyhole className="h-4 w-4" />{busy ? "Signing in…" : "Login"}
            </button>
          </form>
          <p className="mt-4 break-all text-center text-xs text-muted-foreground">Firebase admin account: {ADMIN_EMAIL}</p>
        </div>
      </main>
    </AppShell>
  );
}
