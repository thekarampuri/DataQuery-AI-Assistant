import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApmhKNQHHdmO3Man3JXQlpGoM6pU6nq0c",
  authDomain: "dataquery-ai-assistant.firebaseapp.com",
  databaseURL: "https://dataquery-ai-assistant-default-rtdb.firebaseio.com",
  projectId: "dataquery-ai-assistant",
  storageBucket: "dataquery-ai-assistant.firebasestorage.app",
  messagingSenderId: "1023322516021",
  appId: "1:1023322516021:web:e9a7a26f2b95e763651f7c",
  measurementId: "G-1PVMZR468B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage }; 