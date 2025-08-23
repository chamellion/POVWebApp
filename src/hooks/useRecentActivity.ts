'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ActivityItem {
  id: string;
  collection: string;
  action: 'create' | 'update' | 'delete';
  title: string;
  description: string;
  timestamp: Timestamp;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export function useRecentActivity(limitCount: number = 20) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase not initialized');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Query the centralized activityLog collection
      const q = query(
        collection(db, 'activityLog'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activityData: ActivityItem[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.timestamp) {
              activityData.push({
                id: doc.id,
                collection: data.collection || 'unknown',
                action: data.action || 'create',
                title: data.title || 'Untitled',
                description: data.description || 'No description',
                timestamp: data.timestamp,
                userId: data.userId || null,
                metadata: data.metadata || {}
              });
            }
          });

          setActivities(activityData);
          setLoading(false);
        },
        (err) => {
          console.error('Error listening to activity log:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      // Cleanup function
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up activity listener:', err);
      setError(err instanceof Error ? err.message : 'Failed to set up activity listener');
      setLoading(false);
    }
  }, [limitCount]);

  return { activities, loading, error };
}
