import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyApmhKNQHHdmO3Man3JXQlpGoM6pU6nq0c",
  authDomain: "dataquery-ai-assistant.firebaseapp.com",
  projectId: "dataquery-ai-assistant",
  storageBucket: "dataquery-ai-assistant.appspot.com",
  messagingSenderId: "1023322516021",
  appId: "1:1023322516021:web:e9a7a26f2b95e763651f7c",
  measurementId: "G-1PVMZR468B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics failed to initialize:', error);
  }
}

export { app, analytics, auth, db, storage };

export default app; 