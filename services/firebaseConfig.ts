import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

// Fix for "mgt.clearMarks is not a function" error
if (typeof window !== 'undefined') {
  if (!window.performance.clearMarks) (window.performance as any).clearMarks = () => {};
  if (!window.performance.measure) (window.performance as any).measure = () => ({});
  if (!window.performance.clearMeasures) (window.performance as any).clearMeasures = () => {};
  if (!window.performance.mark) (window.performance as any).mark = () => ({});
}

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCV57SpIcDHNWWrIklPT0O9xDQz0V9ToIs",
  authDomain: "vast-canvas-connect.firebaseapp.com",
  projectId: "vast-canvas-connect",
  storageBucket: "vast-canvas-connect.firebasestorage.app",
  messagingSenderId: "949197894176",
  appId: "1:949197894176:web:7791c8835a7373e9604245",
  measurementId: "G-ZY755BHLFG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app, 'us-central1'); // Default region

let messagingInstance;
try {
  messagingInstance = getMessaging(app);
} catch (error) {
  console.warn("Firebase Messaging not supported:", error);
  messagingInstance = null;
}
export const messaging = messagingInstance;

// Enable offline persistence for Firestore
// DISABLED: Causes cross-tenant data leakage when switching users
// Uncomment below if you want offline functionality, but implement proper cache clearing on logout
/*
try {
  enableIndexedDbPersistence(db).catch((error) => {
    if (error.code === "failed-precondition") {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (error.code === "unimplemented") {
      console.warn("Current browser doesn't support persistence.");
    }
  });
} catch (error) {
  console.warn("Firestore persistence error:", error);
}
*/

export default app;
