import { createServerFn } from "@tanstack/react-start";

// Firebase web config is public by design (Firestore rules are the security boundary),
// but it is kept out of source control and read from Lovable project secrets at runtime.
export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const env = process.env;
  return {
    apiKey: env["FIREBASE_API_KEY"] ?? "",
    authDomain: env["FIREBASE_AUTH_DOMAIN"] ?? "",
    projectId: env["FIREBASE_PROJECT_ID"] ?? "",
    storageBucket: env["FIREBASE_STORAGE_BUCKET"] ?? "",
    messagingSenderId: env["FIREBASE_MESSAGING_SENDER_ID"] ?? "",
    appId: env["FIREBASE_APP_ID"] ?? "",
    adminEmail: env["ADMIN_EMAIL"] ?? "",
  };
});
