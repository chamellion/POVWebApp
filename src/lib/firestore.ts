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
  writeBatch,
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
  testimony: string; // Changed from 'story' to 'testimony' to match actual data
  story?: string; // Keep for backward compatibility
  photo?: string;
  isAnonymous: boolean;
  allowSharing?: boolean; // Made optional since your data might not have this
  isRead?: boolean; // Made optional since your data might not have this
  readBy?: string; // admin userId
  readAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PrayerRequest {
  id?: string;
  name: string | null; // null if anonymous
  email: string | null; // null if anonymous
  request: string; // required prayer request text
  isAnonymous: boolean;
  isRead: boolean; // default false
  readBy?: string; // admin userId who marked as read
  readAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RecurringEvent {
  id?: string;
  title: string;
  description: string;
  location: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // e.g. "09:30"
  endTime: string;   // e.g. "11:00"
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NewsletterSignup {
  id?: string;
  email: string;
  createdAt?: Timestamp;
}

export interface SkippedRecurringEvent {
  id?: string;
  recurringEventId: string;
  skipDate: string; // YYYY-MM-DD format
  reason?: string;
  createdAt?: Timestamp;
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

export interface TestimonyExport {
  id?: string;
  adminId: string;
  adminEmail: string;
  exportType: 'pdf' | 'word';
  testimonyIds: string[];
  exportedAt?: Timestamp;
}

export interface PrayerRequestExport {
  id?: string;
  adminId: string;
  adminEmail: string;
  exportType: 'pdf' | 'word';
  prayerRequestIds: string[];
  exportedAt?: Timestamp;
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
export const recurringEventsCollection = 'recurringEvents';
export const newsletterSignupsCollection = 'newsletterSignups';
export const skippedRecurringEventsCollection = 'skippedRecurringEvents';
export const galleryCollection = 'gallery';
export const testimoniesCollection = 'testimonies';
export const testimoniesExportsCollection = 'testimonies_exports';
export const prayerRequestsCollection = 'prayerRequests';
export const prayerRequestsExportsCollection = 'prayer_requests_exports';
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

// Recurring Events utilities
export const getRecurringEvents = async (): Promise<RecurringEvent[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, recurringEventsCollection), orderBy('dayOfWeek', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RecurringEvent[];
};

export const createRecurringEvent = async (eventData: Omit<RecurringEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = await addDoc(collection(db, recurringEventsCollection), {
    ...eventData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateRecurringEvent = async (event: RecurringEvent): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, recurringEventsCollection, event.id!);
  await updateDoc(docRef, {
    ...event,
    updatedAt: Timestamp.now(),
  });
};

export const deleteRecurringEvent = async (event: RecurringEvent): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, recurringEventsCollection, event.id!);
  await deleteDoc(docRef);
};

// Newsletter Signups utilities
export const getNewsletterSignups = async (): Promise<NewsletterSignup[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, newsletterSignupsCollection), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as NewsletterSignup[];
};

export const createNewsletterSignup = async (email: string): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = await addDoc(collection(db, newsletterSignupsCollection), {
    email,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const deleteNewsletterSignup = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, newsletterSignupsCollection, id);
  await deleteDoc(docRef);
};

// Real-time listeners for newsletter signups
export const subscribeToNewsletterSignups = (
  callback: (data: NewsletterSignup[]) => void
) => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, newsletterSignupsCollection), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NewsletterSignup[];
    callback(data);
  });
};

// Skipped Recurring Events utilities
export const getSkippedRecurringEvents = async (): Promise<SkippedRecurringEvent[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, skippedRecurringEventsCollection), orderBy('skipDate', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SkippedRecurringEvent[];
};

export const createSkippedRecurringEvent = async (skipData: Omit<SkippedRecurringEvent, 'id' | 'createdAt'>): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = await addDoc(collection(db, skippedRecurringEventsCollection), {
    ...skipData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const deleteSkippedRecurringEvent = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  const docRef = doc(db, skippedRecurringEventsCollection, id);
  await deleteDoc(docRef);
};

// Utility function to generate upcoming events from recurring events
export const generateUpcomingRecurringEvents = async (recurringEvents: RecurringEvent[], weeksAhead: number = 4): Promise<Event[]> => {
  const upcomingEvents: Event[] = [];
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + (weeksAhead * 7));

  // Get skipped events to exclude them
  const skippedEvents = await getSkippedRecurringEvents();
  const skippedDates = new Set(skippedEvents.map(skip => skip.skipDate));

  recurringEvents.forEach(recurringEvent => {
    if (!recurringEvent.isActive) return;

    const currentDate = new Date(today);
    
    // Find the next occurrence of this day of week
    while (currentDate.getDay() !== recurringEvent.dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate events for the next few weeks
    while (currentDate <= endDate) {
      const eventDate = currentDate.toISOString().split('T')[0];
      
      // Skip this event if it's in the skipped dates
      if (!skippedDates.has(eventDate)) {
        upcomingEvents.push({
          id: `recurring-${recurringEvent.id}-${eventDate}`,
          title: recurringEvent.title,
          description: recurringEvent.description,
          location: recurringEvent.location,
          date: eventDate,
          startTime: recurringEvent.startTime,
          endTime: recurringEvent.endTime,
          createdAt: recurringEvent.createdAt,
          updatedAt: recurringEvent.updatedAt,
        });
      }

      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
  });

  return upcomingEvents;
};

// Enhanced Testimonies Management Functions
export const getTestimoniesWithFilters = async (
  filters: {
    isAnonymous?: boolean;
    isRead?: boolean;
    allowSharing?: boolean;
    dateFrom?: string;
    dateTo?: string;
  } = {}
): Promise<Testimony[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  let q = query(collection(db, testimoniesCollection), orderBy('createdAt', 'desc'));
  
  // Apply filters
  if (filters.isAnonymous !== undefined) {
    q = query(q, where('isAnonymous', '==', filters.isAnonymous));
  }
  
  if (filters.isRead !== undefined) {
    q = query(q, where('isRead', '==', filters.isRead));
  }
  
  if (filters.allowSharing !== undefined) {
    q = query(q, where('allowSharing', '==', filters.allowSharing));
  }
  
  const querySnapshot = await getDocs(q);
  let testimonies = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Testimony[];
  
  // Apply date range filter (client-side for better performance)
  if (filters.dateFrom || filters.dateTo) {
    testimonies = testimonies.filter(testimony => {
      if (!testimony.createdAt) return false;
      
      const testimonyDate = testimony.createdAt.toDate();
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      
      if (fromDate && testimonyDate < fromDate) return false;
      if (toDate && testimonyDate > toDate) return false;
      
      return true;
    });
  }
  
  return testimonies;
};

export const markTestimonyAsRead = async (
  testimonyId: string, 
  adminId: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adminEmail: string
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const docRef = doc(db, testimoniesCollection, testimonyId);
  await updateDoc(docRef, {
    isRead: true,
    readBy: adminId,
    readAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const markMultipleTestimoniesAsRead = async (
  testimonyIds: string[], 
  adminId: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adminEmail: string
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const batch = writeBatch(db);
  
  testimonyIds.forEach(testimonyId => {
    const docRef = doc(db, testimoniesCollection, testimonyId);
    batch.update(docRef, {
      isRead: true,
      readBy: adminId,
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
  
  await batch.commit();
};

export const subscribeToTestimonies = (
  callback: (data: Testimony[]) => void
) => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, testimoniesCollection), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Testimony[];
    callback(data);
  });
};

export const getUnreadTestimoniesCount = async (): Promise<number> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, testimoniesCollection), where('isRead', '==', false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

// Export Logging Functions
export const logTestimonyExport = async (
  exportData: Omit<TestimonyExport, 'id' | 'exportedAt'>
): Promise<string> => {
  console.log('🔍 logTestimonyExport called with:', exportData);
  
  if (!db) {
    console.error('❌ Firestore database not initialized');
    throw new Error('Firestore is not initialized');
  }
  
  console.log('🔍 Database connection status:', {
    dbExists: !!db,
    dbType: typeof db,
    collectionExists: !!collection(db, testimoniesExportsCollection)
  });
  
  // Validate export data
  if (!exportData.adminId || !exportData.adminEmail) {
    console.error('❌ Invalid export data:', exportData);
    throw new Error('Invalid export data: missing admin information');
  }
  
  console.log('🔍 Logging testimony export:', {
    collection: testimoniesExportsCollection,
    adminId: exportData.adminId,
    adminEmail: exportData.adminEmail,
    exportType: exportData.exportType,
    testimonyCount: exportData.testimonyIds.length
  });
  
  try {
    console.log('🔍 Attempting to add document to collection...');
    const docRef = await addDoc(collection(db, testimoniesExportsCollection), {
      ...exportData,
      exportedAt: Timestamp.now(),
    });
    
    console.log('✅ Export logged successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to log export:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as { code?: string })?.code,
      collection: testimoniesExportsCollection,
      adminId: exportData.adminId,
      adminEmail: exportData.adminEmail,
      errorType: error?.constructor?.name,
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
};

export const getTestimonyExports = async (): Promise<TestimonyExport[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, testimoniesExportsCollection), orderBy('exportedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TestimonyExport[];
}; 

// Prayer Request Management Functions
export const getPrayerRequestsWithFilters = async (
  filters: {
    searchTerm?: string;
    filterType?: 'all' | 'anonymous' | 'non-anonymous' | 'unread' | 'read';
    dateFrom?: string;
    dateTo?: string;
  } = {}
): Promise<PrayerRequest[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const q = query(collection(db, prayerRequestsCollection), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  let prayerRequests = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PrayerRequest[];
  
  // Apply filters
  if (filters.searchTerm) {
    prayerRequests = prayerRequests.filter(request => 
      (request.name && request.name.toLowerCase().includes(filters.searchTerm!.toLowerCase())) ||
      request.request.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
      (request.email && request.email.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
    );
  }
  
  if (filters.filterType && filters.filterType !== 'all') {
    switch (filters.filterType) {
      case 'anonymous':
        prayerRequests = prayerRequests.filter(request => request.isAnonymous);
        break;
      case 'non-anonymous':
        prayerRequests = prayerRequests.filter(request => !request.isAnonymous);
        break;
      case 'unread':
        prayerRequests = prayerRequests.filter(request => !request.isRead);
        break;
      case 'read':
        prayerRequests = prayerRequests.filter(request => request.isRead);
        break;
    }
  }
  
  if (filters.dateFrom || filters.dateTo) {
    prayerRequests = prayerRequests.filter(request => {
      if (!request.createdAt) return false;
      const requestDate = request.createdAt.toDate();
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      
      if (fromDate && requestDate < fromDate) return false;
      if (toDate && requestDate > toDate) return false;
      
      return true;
    });
  }
  
  return prayerRequests;
};

export const markPrayerRequestAsRead = async (
  requestId: string, 
  adminId: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adminEmail: string
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const docRef = doc(db, prayerRequestsCollection, requestId);
  await updateDoc(docRef, {
    isRead: true,
    readBy: adminId,
    readAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

export const markMultiplePrayerRequestsAsRead = async (
  requestIds: string[], 
  adminId: string, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  adminEmail: string
): Promise<void> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const batch = writeBatch(db);
  
  requestIds.forEach(requestId => {
    const docRef = doc(db, prayerRequestsCollection, requestId);
    batch.update(docRef, {
      isRead: true,
      readBy: adminId,
      readAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
  
  await batch.commit();
};

export const subscribeToPrayerRequests = (
  callback: (data: PrayerRequest[]) => void
) => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, prayerRequestsCollection), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PrayerRequest[];
    callback(data);
  });
};

export const getUnreadPrayerRequestsCount = async (): Promise<number> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  const q = query(collection(db, prayerRequestsCollection), where('isRead', '==', false));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

export const logPrayerRequestExport = async (
  exportData: Omit<PrayerRequestExport, 'id' | 'exportedAt'>
): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized');
  
  // Validate export data
  if (!exportData.adminId || !exportData.adminEmail) {
    throw new Error('Invalid export data: missing admin information');
  }
  
  try {
    const docRef = await addDoc(collection(db, prayerRequestsExportsCollection), {
      ...exportData,
      exportedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Failed to log prayer request export:', error);
    throw error;
  }
};

export const getPrayerRequestExports = async (): Promise<PrayerRequestExport[]> => {
  if (!db) throw new Error('Firestore is not initialized');
  const q = query(collection(db, prayerRequestsExportsCollection), orderBy('exportedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PrayerRequestExport[];
};