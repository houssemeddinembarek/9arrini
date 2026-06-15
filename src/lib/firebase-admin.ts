// Firebase Admin — verifies the ID tokens produced by the client SDK so we can
// trust the user's identity before bridging them into our own JWT session.
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Private keys are stored with literal "\n" in env files.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminAuth = getAuth(getAdminApp());
