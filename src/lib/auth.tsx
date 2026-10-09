import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ADMIN_EMAIL, auth, firebaseConfigured, initFirebase } from "@/lib/firebase";
import { getFirebaseConfig } from "@/lib/firebase-config.functions";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getFirebaseConfig().then(initFirebase).catch((e: unknown) => console.error("Firebase config load failed", e)).finally(() => setReady(true));
  }, []);
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  return <AuthInner>{children}</AuthInner>;
}

function AuthInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAdmin: Boolean(user?.email && user.email.toLowerCase() === ADMIN_EMAIL),
    async login(username, password) {
      if (!firebaseConfigured || !auth) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* values to your .env file.");
      if (username.trim().toLowerCase() !== "admin") throw new Error("Invalid username or password.");
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
    },
    async logout() {
      if (auth) await signOut(auth);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
