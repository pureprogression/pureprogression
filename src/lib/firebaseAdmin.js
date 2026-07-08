import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

export function getAdminDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not configured");
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON");
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

export { FieldValue as adminFieldValue, Timestamp as adminTimestamp };
