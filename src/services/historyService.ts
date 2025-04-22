import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
  DocumentData,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { HistorySession, FileMetadata, ConversationMessage, QueryResult } from '../types/history';

// Constants for collection names
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

export const createUserDocument = async (uid: string, userData: { name: string | null; email: string | null }) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: userData.name || 'No Name',
      email: userData.email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    console.log('User document created in Firestore');
  } else {
    // Update last login
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
  }
};

export const createSession = async (uid: string, fileMetadata: FileMetadata): Promise<string> => {
  console.log('Creating new session with file:', fileMetadata.name);
  
  // Create session in the user's sessions subcollection with server timestamps
  const userSessionsRef = collection(db, USERS_COLLECTION, uid, SESSIONS_COLLECTION);
  const sessionDoc = await addDoc(userSessionsRef, {
    file: {
      ...fileMetadata,
      uploadDate: serverTimestamp(),
      data: fileMetadata.data || [],
      previewData: fileMetadata.previewData || [],
      totalRows: fileMetadata.totalRows || 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    conversation: [],
    queries: []
  });
  
  console.log('Session created with ID:', sessionDoc.id);
  return sessionDoc.id;
};

export const updateSession = async (
  uid: string,
  sessionId: string,
  conversation: ConversationMessage[],
  queries: QueryResult[],
  currentData?: any[]
) => {
  console.log('Updating session:', sessionId);
  
  // Update session in the user's sessions subcollection with current server timestamp
  const sessionRef = doc(db, USERS_COLLECTION, uid, SESSIONS_COLLECTION, sessionId);
  
  const updateData: any = {
    conversation: conversation.map(msg => ({
      ...msg,
      timestamp: msg.timestamp || serverTimestamp()
    })),
    queries: queries.map(query => ({
      ...query,
      timestamp: query.timestamp || serverTimestamp()
    })),
    updatedAt: serverTimestamp()
  };

  // Only update the data if it's provided
  if (currentData) {
    updateData['file.data'] = currentData;
    updateData['file.previewData'] = currentData.slice(0, 10);
    updateData['file.totalRows'] = currentData.length;
  }

  await updateDoc(sessionRef, updateData);
  console.log('Session updated successfully');
};

export const getUserSessions = async (uid: string): Promise<HistorySession[]> => {
  console.log('Fetching sessions for user:', uid);
  
  // Get sessions from the user's sessions subcollection
  const userSessionsRef = collection(db, USERS_COLLECTION, uid, SESSIONS_COLLECTION);
  const q = query(userSessionsRef, orderBy('createdAt', 'desc')); // Order by creation timestamp
  const snapshot = await getDocs(q);
  
  const sessions = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to JavaScript Dates
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      file: {
        ...data.file,
        uploadDate: data.file.uploadDate?.toDate() || new Date()
      },
      // Convert timestamps in conversation and queries
      conversation: (data.conversation || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate() || new Date()
      })),
      queries: (data.queries || []).map((query: any) => ({
        ...query,
        timestamp: query.timestamp?.toDate() || new Date()
      }))
    };
  }) as HistorySession[];
  
  console.log('Fetched sessions:', sessions);
  return sessions;
};

export const deleteSession = async (uid: string, sessionId: string) => {
  console.log('Deleting session:', sessionId);
  
  // Delete session from the user's sessions subcollection
  const sessionRef = doc(db, USERS_COLLECTION, uid, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(sessionRef);
  console.log('Session deleted successfully');
};

export const getSession = async (uid: string, sessionId: string): Promise<HistorySession | null> => {
  console.log('Fetching session:', sessionId);
  
  // Get session from the user's sessions subcollection
  const sessionRef = doc(db, USERS_COLLECTION, uid, SESSIONS_COLLECTION, sessionId);
  const sessionSnap = await getDoc(sessionRef);
  
  if (!sessionSnap.exists()) {
    console.log('Session not found');
    return null;
  }
  
  const data = sessionSnap.data();
  const session = {
    id: sessionId,
    ...data,
    // Convert Firestore Timestamps to JavaScript Dates
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    file: {
      ...data.file,
      uploadDate: data.file.uploadDate?.toDate() || new Date()
    },
    // Convert timestamps in conversation and queries
    conversation: (data.conversation || []).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp?.toDate() || new Date()
    })),
    queries: (data.queries || []).map((query: any) => ({
      ...query,
      timestamp: query.timestamp?.toDate() || new Date()
    }))
  } as HistorySession;
  
  console.log('Fetched session:', session);
  return session;
}; 