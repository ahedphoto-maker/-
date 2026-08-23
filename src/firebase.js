import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "al-ahad-app-2026",
  appId: "1:802125772755:web:32a0ca34902d98bf852126",
  storageBucket: "al-ahad-app-2026.firebasestorage.app",
  apiKey: "AIzaSyBxoAEH-wEoql871gEftNz-PJbA2WlwWkY",
  authDomain: "al-ahad-app-2026.firebaseapp.com",
  messagingSenderId: "802125772755",
  projectNumber: "802125772755"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence.");
    }
  });
}

export { db, auth };
