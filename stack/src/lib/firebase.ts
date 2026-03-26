// Firebase configuration using v9+ modular SDK
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "codequest-1b25c.firebaseapp.com",
  projectId: "codequest-1b25c",
  storageBucket: "codequest-1b25c.firebasestorage.app",
  messagingSenderId: "471695710454",
  appId: "1:471695710454:web:07ae0c498b78803af834d7",
  measurementId: "G-J33NHPHQS0",
};

// Initialize Firebase (prevent multiple initializations)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export auth instance
export const auth = getAuth(app);

export default app;
