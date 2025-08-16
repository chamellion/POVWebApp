'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ActivityItem {
  id: string;
  type: 'added' | 'updated' | 'deleted';
  collection: string;
  title: string;
  timestamp: Timestamp;
  description: string;
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const allActivities: ActivityItem[] = [];

        // Fetch recent items from each collection
        const collections = [
          { name: 'events', titleField: 'title', description: 'Event' },
          { name: 'carousel', titleField: 'headline', description: 'Carousel slide' },
          { name: 'testimonies', titleField: 'name', description: 'Testimony' },
          { name: 'prayerRequests', titleField: 'name', description: 'Prayer request' },
          { name: 'gallery', titleField: 'title', description: 'Gallery item' },
        ];

        for (const collectionInfo of collections) {
          try {
            const q = query(
              collection(db, collectionInfo.name),
              orderBy('createdAt', 'desc'),
              limit(3)
            );
            
            const snapshot = await getDocs(q);
            
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.createdAt) {
                const title = data[collectionInfo.titleField] || 
                             (collectionInfo.name === 'testimonies' && data.isAnonymous ? 'Anonymous' : 'Untitled') ||
                             (collectionInfo.name === 'prayerRequests' && data.isAnonymous ? 'Anonymous' : 'Untitled') ||
                             'Untitled';
                
                allActivities.push({
                  id: doc.id,
                  type: 'added',
                  collection: collectionInfo.name,
                  title,
                  timestamp: data.createdAt,
                  description: collectionInfo.description,
                });
              }
            });
          } catch (err) {
            console.warn(`Failed to fetch from ${collectionInfo.name}:`, err);
            // Continue with other collections
          }
        }

        // Sort all activities by timestamp and take the most recent 5
        const sortedActivities = allActivities
          .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
          .slice(0, 5);

        setActivities(sortedActivities);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  return { activities, loading, error };
}
