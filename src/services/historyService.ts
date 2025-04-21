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
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { HistorySession, FileMetadata, ConversationMessage, QueryResult } from '../types/history';

const COLLECTION_NAME = 'sessions';

export const createSession = async (userId: string, fileMetadata: FileMetadata): Promise<string> => {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const newSession = {
      userId,
      file: {
        ...fileMetadata,
        uploadDate: Timestamp.fromDate(fileMetadata.uploadDate)
      },
      conversation: [],
      queries: [],
      createdAt: Timestamp.now(),
      lastUpdated: Timestamp.now(),
      title: fileMetadata.name
    };
    
    const docRef = await addDoc(sessionsRef, newSession);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const updateSession = async (
  userId: string,
  sessionId: string,
  conversation: HistorySession['conversation'],
  queries: QueryResult[]
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      conversation,
      queries,
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

export const getUserSessions = async (userId: string): Promise<HistorySession[]> => {
  try {
    const sessionsRef = collection(db, 'users', userId, 'sessions');
    const q = query(sessionsRef, orderBy('lastUpdated', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        file: {
          name: data.file.name,
          uploadDate: (data.file.uploadDate as Timestamp).toDate(),
          schema: data.file.schema
        },
        conversation: data.conversation,
        queries: data.queries,
        createdAt: (data.createdAt as Timestamp).toDate(),
        lastUpdated: (data.lastUpdated as Timestamp).toDate(),
        title: data.title
      } as HistorySession;
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
};

export const getSession = async (sessionId: string): Promise<HistorySession | null> => {
  const sessionRef = doc(db, COLLECTION_NAME, sessionId);
  const sessionDoc = await getDoc(sessionRef);

  if (!sessionDoc.exists()) {
    return null;
  }

  const data = sessionDoc.data();
  return {
    id: sessionDoc.id,
    userId: data.userId,
    file: {
      ...data.file,
      uploadDate: (data.file.uploadDate as Timestamp).toDate()
    },
    conversation: data.conversation,
    queries: data.queries,
    createdAt: (data.createdAt as Timestamp).toDate(),
    lastUpdated: (data.lastUpdated as Timestamp).toDate(),
    title: data.title
  } as HistorySession;
}; 