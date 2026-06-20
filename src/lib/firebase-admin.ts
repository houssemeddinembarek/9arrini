// Firebase Admin — verifies the ID tokens produced by the client SDK so we can
// trust the user's identity before bridging them into our own JWT session.
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

// Hosts (Vercel, .env files) mangle the PEM in a few predictable ways: they wrap
// it in quotes, keep the newlines as literal "\n", or — to dodge newline issues
// entirely — store it base64-encoded. Normalise all of those back to a real PEM.
function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  // Strip a single pair of wrapping quotes.
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // If it isn't a PEM yet, it may be base64-encoded — decode and see.
  if (!key.includes("BEGIN")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8");
      if (decoded.includes("BEGIN")) key = decoded;
    } catch { /* not base64 — fall through */ }
  }
  // Turn escaped newlines/CRs into real newlines.
  return key.replace(/\\r/g, "").replace(/\\n/g, "\n");
}

function getAdminApp(): App {
  if (getApps().length) return getApp();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

// Lazy: the app is only initialised on first use at runtime, so a missing
// credential never breaks the build (page-data collection imports this module).
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
