import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFirebaseConfig } from './config/validateFirebase';

console.log('🔄 Starting Firebase initialization...');

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
let app;
try {
  console.log('🚀 Initializing Firebase app...');
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase app initialization failed:', error);
  throw new Error('Firebase initialization failed. Please check your configuration.');
}

// Initialize Firebase services
console.log('🔧 Initializing Firebase services...');

export const auth = getAuth(app);
console.log('✅ Firebase Auth initialized successfully');

export const db = getFirestore(app);
console.log('✅ Firestore initialized successfully');

export const storage = getStorage(app);
console.log('✅ Firebase Storage initialized successfully');

console.log('🏁 Firebase initialization complete');

export default app; 