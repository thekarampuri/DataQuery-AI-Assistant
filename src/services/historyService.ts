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

export const createSession = async (
  userId: string,
  file: FileMetadata,
  title?: string
): Promise<string> => {
  const session: Omit<HistorySession, 'id'> = {
    userId,
    file,
    conversation: [],
    queries: [],
    createdAt: new Date(),
    lastUpdated: new Date(),
    title: title || file.name
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...session,
    createdAt: Timestamp.fromDate(session.createdAt),
    lastUpdated: Timestamp.fromDate(session.lastUpdated),
    file: {
      ...file,
      uploadDate: Timestamp.fromDate(file.uploadDate)
    }
  });

  return docRef.id;
};

export const updateSession = async (
  sessionId: string,
  conversation: ConversationMessage[],
  queries: QueryResult[]
): Promise<void> => {
  const sessionRef = doc(db, COLLECTION_NAME, sessionId);
  await updateDoc(sessionRef, {
    conversation,
    queries,
    lastUpdated: Timestamp.fromDate(new Date())
  });
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const sessionRef = doc(db, COLLECTION_NAME, sessionId);
  await deleteDoc(sessionRef);
};

export const getUserSessions = async (userId: string): Promise<HistorySession[]> => {
  const sessionsQuery = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('lastUpdated', 'desc')
  );

  const querySnapshot = await getDocs(sessionsQuery);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
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
  });
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