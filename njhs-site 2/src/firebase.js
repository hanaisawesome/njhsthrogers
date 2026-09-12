// ─────────────────────────────────────────────────────────────
// PASTE YOUR FIREBASE CONFIG HERE
// Get it from: Firebase Console → Project settings → Your apps
// → SDK setup and configuration → Config
// ─────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PASTE_YOURS_HERE",
  authDomain: "PASTE_YOURS_HERE",
  projectId: "PASTE_YOURS_HERE",
  storageBucket: "PASTE_YOURS_HERE",
  messagingSenderId: "PASTE_YOURS_HERE",
  appId: "PASTE_YOURS_HERE",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
