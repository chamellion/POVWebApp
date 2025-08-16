'use client';

import { useState, useEffect } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CollectionCounts {
  carousel: number;
  leaders: number;
  events: number;
  gallery: number;
  testimonies: number;
  prayerRequests: number;
  newsletterSignups: number;
}

export function useCollectionCounts() {
  const [counts, setCounts] = useState<CollectionCounts>({
    carousel: 0,
    leaders: 0,
    events: 0,
    gallery: 0,
    testimonies: 0,
    prayerRequests: 0,
    newsletterSignups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch counts for all collections
        const [
          carouselCount,
          pastorsCount,
          eventsCount,
          galleryCount,
          testimoniesCount,
          prayerRequestsCount,
          newsletterSignupsCount,
        ] = await Promise.all([
          getCountFromServer(collection(db, 'carousel')),
          getCountFromServer(query(collection(db, 'pastors'), where('category', '==', 'pastor'))),
          getCountFromServer(collection(db, 'events')),
          getCountFromServer(collection(db, 'gallery')),
          getCountFromServer(collection(db, 'testimonies')),
          getCountFromServer(collection(db, 'prayerRequests')),
          getCountFromServer(collection(db, 'newsletterSignups')),
        ]);

        setCounts({
          carousel: carouselCount.data().count,
          leaders: pastorsCount.data().count,
          events: eventsCount.data().count,
          gallery: galleryCount.data().count,
          testimonies: testimoniesCount.data().count,
          prayerRequests: prayerRequestsCount.data().count,
          newsletterSignups: newsletterSignupsCount.data().count,
        });
      } catch (err) {
        console.error('Error fetching collection counts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch counts');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return { counts, loading, error };
}
