import fs from "fs";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount(): any {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY_JSON");

  const trimmed = raw.trim();

  // Supports:
  // A) JSON string pasted into env var
  if (trimmed.startsWith("{")) return JSON.parse(trimmed);

  // B) File path to JSON (Windows)
  const json = fs.readFileSync(trimmed, "utf8");
  return JSON.parse(json);
}

export function adminDb() {
  if (!getApps().length) {
    const serviceAccount = loadServiceAccount();
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}