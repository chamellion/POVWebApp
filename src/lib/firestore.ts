import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Leader {
  id?: string;
  customId?: number; // Numeric ID for ranking (1 = Lead Pastor, 2 = Associate Pastor, etc.)
  name: string;
  role: string;
  bio: string;
  image: string;
  category: 'pastor' | 'teamLead'; // Simplified to just two main categories
  order: number;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Event {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GalleryItem {
  id?: string;
  caption: string;
  category: string;
  imageUrl: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Testimony {
  id?: string;
  name: string;
  story: string;
  photo?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SiteSettings {
  id?: string;
  homeHeroText: string;
  contactPhone: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  updatedAt?: Timestamp;
}

// Generic CRUD operations
export const createDocument = async <T>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateDocument = async <T>(
  collectionName: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt'>>
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

export const getDocument = async <T>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const getDocuments = async <T>(
  collectionName: string
): Promise<T[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

// Real-time listeners
export const subscribeToCollection = <T>(
  collectionName: string,
  callback: (data: T[]) => void
) => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    callback(data);
  });
};

// Specific collection helpers
export const leadersCollection = 'leaders';
export const pastorsCollection = 'pastors';
export const teamLeadsCollection = 'teamLeads';
export const eventsCollection = 'events';
export const galleryCollection = 'gallery';
export const testimoniesCollection = 'testimonies';
export const settingsCollection = 'settings';

// Leader-specific utilities
export const getLeadersByCategory = async (category: 'pastor' | 'teamLead'): Promise<Leader[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const collectionName = category === 'pastor' ? pastorsCollection : teamLeadsCollection;
  const q = query(collection(db, collectionName), orderBy('customId', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    category // Ensure category is set correctly
  })) as Leader[];
};

export const createLeader = async (leaderData: Omit<Leader, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const collectionName = leaderData.category === 'pastor' ? pastorsCollection : teamLeadsCollection;
  const docRef = await addDoc(collection(db, collectionName), {
    ...leaderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateLeader = async (leader: Leader): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const collectionName = leader.category === 'pastor' ? pastorsCollection : teamLeadsCollection;
  const docRef = doc(db, collectionName, leader.id!);
  await updateDoc(docRef, {
    ...leader,
    updatedAt: Timestamp.now(),
  });
};

export const deleteLeader = async (leader: Leader): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const collectionName = leader.category === 'pastor' ? pastorsCollection : teamLeadsCollection;
  const docRef = doc(db, collectionName, leader.id!);
  await deleteDoc(docRef);
};

// Real-time listeners for leaders
export const subscribeToLeadersByCategory = (
  category: 'pastor' | 'teamLead',
  callback: (data: Leader[]) => void
) => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const collectionName = category === 'pastor' ? pastorsCollection : teamLeadsCollection;
  const q = query(collection(db, collectionName), orderBy('customId', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      category // Ensure category is set correctly
    })) as Leader[];
    callback(data);
  });
}; 

// Migration utility to move existing leaders to new structure
export const migrateLeadersToNewStructure = async (): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  try {
    // Get all leaders from the old collection
    const oldLeadersQuery = query(collection(db, leadersCollection));
    const oldLeadersSnapshot = await getDocs(oldLeadersQuery);
    
    if (oldLeadersSnapshot.empty) {
      console.log('No leaders to migrate');
      return;
    }

    console.log(`Found ${oldLeadersSnapshot.docs.length} leaders to migrate`);

    // Process each leader
    for (const doc of oldLeadersSnapshot.docs) {
      const leaderData = doc.data() as Record<string, unknown>;
      
      // Determine the new category based on the old category
      let newCategory: 'pastor' | 'teamLead';
      if (leaderData.category === 'pastoral') {
        newCategory = 'pastor';
      } else {
        newCategory = 'teamLead'; // department, ministry, board all become teamLead
      }

      // Create the leader in the new collection
      const newLeaderData = {
        ...leaderData,
        category: newCategory,
        createdAt: leaderData.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const collectionName = newCategory === 'pastor' ? pastorsCollection : teamLeadsCollection;
      await addDoc(collection(db, collectionName), newLeaderData);
      
      console.log(`Migrated ${leaderData.name} to ${newCategory} collection`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}; 

// Find leader by custom ID
export const findLeaderByCustomId = async (customId: number): Promise<Leader | null> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  try {
    // Search in pastors collection
    const pastorsQuery = query(
      collection(db, pastorsCollection),
      where('customId', '==', customId)
    );
    const pastorsSnapshot = await getDocs(pastorsQuery);
    
    if (!pastorsSnapshot.empty) {
      const doc = pastorsSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        category: 'pastor'
      } as Leader;
    }
    
    // Search in team leads collection
    const teamLeadsQuery = query(
      collection(db, teamLeadsCollection),
      where('customId', '==', customId)
    );
    const teamLeadsSnapshot = await getDocs(teamLeadsQuery);
    
    if (!teamLeadsSnapshot.empty) {
      const doc = teamLeadsSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        category: 'teamLead'
      } as Leader;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding leader by custom ID:', error);
    return null;
  }
}; 