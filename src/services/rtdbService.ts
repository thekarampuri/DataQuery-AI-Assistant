import { ref, get, set, push, getDatabase } from 'firebase/database';
import { database } from '../config/firebase';
import { query, orderByChild } from 'firebase/database';

interface ConversationMessage {
  timestamp: number;
  role: 'user' | 'assistant';
  message: string;
}

// Add debug function
const debugDatabaseConnection = async () => {
  try {
    const testRef = ref(database, '.info/connected');
    const snapshot = await get(testRef);
    console.log('Database connection status:', snapshot.val());
    return snapshot.val();
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Check if user exists in RTDB
export const checkUserExists = async (uid: string): Promise<boolean> => {
  try {
    await debugDatabaseConnection(); // Add connection check
    console.log('Checking if user exists:', uid);
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    console.log('User exists check result:', snapshot.exists(), 'Data:', snapshot.val());
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking user existence:', error, 'Database instance:', database);
    return false;
  }
};

// Create new user data structure in RTDB
export const createUserData = async (uid: string) => {
  try {
    console.log('Creating user data structure:', uid);
    const userRef = ref(database, `users/${uid}`);
    const initialData = {
      conversationHistory: {}
    };
    await set(userRef, initialData);
    console.log('User data structure created successfully');
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
};

// Get the next conversation number
const getNextConversationNumber = async (uid: string): Promise<number> => {
  try {
    const historyRef = ref(database, `users/${uid}/conversationHistory`);
    const snapshot = await get(historyRef);
    const history = snapshot.val() || {};
    const numbers = Object.keys(history).map(key => parseInt(key));
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    console.log('Next conversation number:', nextNumber);
    return nextNumber;
  } catch (error) {
    console.error('Error getting next conversation number:', error);
    throw error;
  }
};

// Add new conversation message
export const addConversationMessage = async (
  uid: string,
  message: string,
  role: 'user' | 'assistant'
) => {
  try {
    console.log('Adding message for user:', uid, 'Role:', role);
    
    // Ensure user exists
    const exists = await checkUserExists(uid);
    if (!exists) {
      console.log('User does not exist, creating data structure');
      await createUserData(uid);
    }

    const nextNumber = await getNextConversationNumber(uid);
    const historyRef = ref(database, `users/${uid}/conversationHistory/${nextNumber}`);
    
    const newMessage = {
      role,
      message,
      timestamp: Date.now()
    };
    
    await set(historyRef, newMessage);
    console.log('Message added successfully');
    return nextNumber;
  } catch (error) {
    console.error('Error adding message to RTDB:', error);
    throw error;
  }
};

// Get user's conversation history
export const getConversationHistory = async (uid: string): Promise<ConversationMessage[]> => {
  try {
    await debugDatabaseConnection(); // Add connection check
    console.log('Getting conversation history for user:', uid);
    
    // Ensure user exists
    const exists = await checkUserExists(uid);
    if (!exists) {
      console.log('User does not exist, creating data structure');
      await createUserData(uid);
      return [];
    }

    const historyRef = ref(database, `users/${uid}/conversationHistory`);
    console.log('History reference path:', historyRef.toString());
    const snapshot = await get(historyRef);
    console.log('History snapshot exists:', snapshot.exists(), 'Raw data:', snapshot.val());
    
    const history = snapshot.val() || {};
    
    // Convert object to array and sort by timestamp with type safety
    const sortedHistory = Object.values(history)
      .map(message => message as ConversationMessage)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Processed and sorted history:', sortedHistory);
    return sortedHistory;
  } catch (error) {
    console.error('Error getting conversation history:', error, 'Database path:', `users/${uid}/conversationHistory`);
    return [];
  }
};

// Retrieves conversation messages for a user (alias for getConversationHistory for backward compatibility)
export const getConversationMessages = async (uid: string): Promise<ConversationMessage[]> => {
  return getConversationHistory(uid);
}; 