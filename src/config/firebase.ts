import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, onValue, DataSnapshot } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://dataquery-ai-assistant-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Log detailed database initialization
console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: '***' // Hide sensitive data
});
console.log('Firebase RTDB initialized with URL:', firebaseConfig.databaseURL);
console.log('Database instance:', database);

// Verify database connection
const verifyDatabaseConnection = async () => {
  try {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot: DataSnapshot) => {
      if (snapshot.val() === true) {
        console.log('Connected to Firebase RTDB');
      } else {
        console.log('Not connected to Firebase RTDB');
      }
    });
  } catch (error) {
    console.error('Error verifying database connection:', error);
  }
};

verifyDatabaseConnection();

export { app, auth, db, storage, analytics, database };
export default app; 