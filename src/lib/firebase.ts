import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseRuntimeConfig = {
  apiKey: string; authDomain: string; projectId: string; storageBucket: string;
  messagingSenderId: string; appId: string; adminEmail: string;
};

// Live ES-module bindings: set once by initFirebase() before the app renders.
export let firebaseConfigured = false;
export let auth: Auth | null = null;
export let db: Firestore | null = null;
export let missingFirebaseKeys: string[] = [];

export const ADMIN_USERNAME = "admin";
export let ADMIN_EMAIL = "admin@hclub.com";

export function initFirebase(cfg: FirebaseRuntimeConfig) {
  const map: Record<string, string> = {
    FIREBASE_API_KEY: cfg.apiKey, FIREBASE_AUTH_DOMAIN: cfg.authDomain, FIREBASE_PROJECT_ID: cfg.projectId,
    FIREBASE_STORAGE_BUCKET: cfg.storageBucket, FIREBASE_MESSAGING_SENDER_ID: cfg.messagingSenderId, FIREBASE_APP_ID: cfg.appId,
  };
  missingFirebaseKeys = Object.entries(map).filter(([, v]) => !v).map(([k]) => k);
  if (cfg.adminEmail) ADMIN_EMAIL = cfg.adminEmail.trim().toLowerCase();
  firebaseConfigured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);
  if (!firebaseConfigured) return;
  const { adminEmail: _a, ...config } = cfg;
  const app: FirebaseApp = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}
