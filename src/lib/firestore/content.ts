import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  writeBatch,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';

// Types for content management
export interface CarouselSlide {
  id?: string;
  imageUrl: string;
  headline: string;
  subheadline: string;
  ctaText?: string;
  ctaLink?: string;
  isVisible: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface MissionVision {
  id?: string;
  mission: string;
  vision: string;
  updatedAt?: Timestamp;
}

export interface ServiceTime {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  description: string;
  isActive: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AboutContent {
  id?: string;
  title: string;
  content: string;
  sections: {
    title: string;
    content: string;
  }[];
  updatedAt?: Timestamp;
}

export interface CommunityService {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  isActive: boolean;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Carousel Management
export const carouselCollection = 'carousel';

export async function getCarouselSlides(): Promise<CarouselSlide[]> {
  const q = query(
    collection(db, carouselCollection),
    where('isVisible', '==', true),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CarouselSlide[];
}

export async function getAllCarouselSlides(): Promise<CarouselSlide[]> {
  const q = query(
    collection(db, carouselCollection),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CarouselSlide[];
}

// Real-time listener for carousel slides
export function subscribeToCarouselSlides(
  callback: (slides: CarouselSlide[]) => void,
  includeHidden: boolean = false
): Unsubscribe {
  let q;
  
  if (includeHidden) {
    q = query(
      collection(db, carouselCollection),
      orderBy('order', 'asc')
    );
  } else {
    q = query(
      collection(db, carouselCollection),
      where('isVisible', '==', true),
      orderBy('order', 'asc')
    );
  }
  
  return onSnapshot(q, (snapshot) => {
    const slides = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CarouselSlide[];
    callback(slides);
  });
}

export async function addCarouselSlide(slide: Omit<CarouselSlide, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  // Get the current highest order to assign the next order value
  const existingSlides = await getAllCarouselSlides();
  const nextOrder = existingSlides.length;
  
  const docRef = await addDoc(collection(db, carouselCollection), {
    ...slide,
    order: slide.order ?? nextOrder, // Use provided order or next available
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCarouselSlide(id: string, updates: Partial<CarouselSlide>): Promise<void> {
  await updateDoc(doc(db, carouselCollection, id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCarouselSlide(id: string): Promise<void> {
  await deleteDoc(doc(db, carouselCollection, id));
}

export async function reorderCarouselSlides(slides: { id: string; order: number }[]): Promise<void> {
  const batch = writeBatch(db);
  
  slides.forEach(({ id, order }) => {
    const docRef = doc(db, carouselCollection, id);
    batch.update(docRef, { order, updatedAt: serverTimestamp() });
  });
  
  await batch.commit();
}

// Mission & Vision Management
export const missionVisionCollection = 'mission_vision';

export async function getMissionVision(): Promise<MissionVision | null> {
  const snapshot = await getDocs(collection(db, missionVisionCollection));
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as MissionVision;
}

export async function updateMissionVision(data: { mission: string; vision: string }): Promise<void> {
  const existing = await getMissionVision();
  
  if (existing) {
    await updateDoc(doc(db, missionVisionCollection, existing.id!), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } else {
    await addDoc(collection(db, missionVisionCollection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// Service Times Management
export const serviceTimesCollection = 'service_times';

export async function getServiceTimes(): Promise<ServiceTime[]> {
  const q = query(
    collection(db, serviceTimesCollection),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ServiceTime[];
}

export async function getAllServiceTimes(): Promise<ServiceTime[]> {
  const q = query(
    collection(db, serviceTimesCollection),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ServiceTime[];
}

export async function addServiceTime(service: Omit<ServiceTime, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, serviceTimesCollection), {
    ...service,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateServiceTime(id: string, updates: Partial<ServiceTime>): Promise<void> {
  await updateDoc(doc(db, serviceTimesCollection, id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteServiceTime(id: string): Promise<void> {
  await deleteDoc(doc(db, serviceTimesCollection, id));
}

// About Content Management
export const aboutCollection = 'about';

export async function getAboutContent(): Promise<AboutContent | null> {
  const snapshot = await getDocs(collection(db, aboutCollection));
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as AboutContent;
}

export async function updateAboutContent(data: Partial<AboutContent>): Promise<void> {
  const existing = await getAboutContent();
  
  if (existing) {
    await updateDoc(doc(db, aboutCollection, existing.id!), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } else {
    await addDoc(collection(db, aboutCollection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

// Community Service Management
export const communityServiceCollection = 'community_service';

export async function getCommunityServices(): Promise<CommunityService[]> {
  const q = query(
    collection(db, communityServiceCollection),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CommunityService[];
}

export async function getAllCommunityServices(): Promise<CommunityService[]> {
  const q = query(
    collection(db, communityServiceCollection),
    orderBy('order', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CommunityService[];
}

export async function addCommunityService(service: Omit<CommunityService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, communityServiceCollection), {
    ...service,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateCommunityService(id: string, updates: Partial<CommunityService>): Promise<void> {
  await updateDoc(doc(db, communityServiceCollection, id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteCommunityService(id: string): Promise<void> {
  await deleteDoc(doc(db, communityServiceCollection, id));
}

// Enhanced Gallery with Categories
export interface GalleryImage {
  id?: string;
  url: string;
  title: string;
  description?: string;
  categories: string[];
  tags: string[];
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const galleryCollection = 'gallery';

export async function getGalleryImages(category?: string): Promise<GalleryImage[]> {
  let q = query(
    collection(db, galleryCollection),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  if (category) {
    q = query(
      collection(db, galleryCollection),
      where('isActive', '==', true),
      where('categories', 'array-contains', category),
      orderBy('createdAt', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GalleryImage[];
}

export async function getAllGalleryImages(): Promise<GalleryImage[]> {
  const q = query(
    collection(db, galleryCollection),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as GalleryImage[];
}

export async function addGalleryImage(image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, galleryCollection), {
    ...image,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateGalleryImage(id: string, updates: Partial<GalleryImage>): Promise<void> {
  await updateDoc(doc(db, galleryCollection, id), {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await deleteDoc(doc(db, galleryCollection, id));
} 