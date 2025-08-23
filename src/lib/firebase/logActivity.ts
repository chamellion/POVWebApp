import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { getUserProfile } from "../firestore";

export interface ActivityLogData {
  collectionName: string;
  action: 'create' | 'update' | 'delete';
  title: string;
  description: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  collectionName,
  action,
  title,
  description,
  userId,
  metadata = {}
}: ActivityLogData) {
  try {
    // Try to resolve user name if userId is provided
    let userName = userId || null;
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId);
        if (userProfile) {
          userName = `${userProfile.firstName} ${userProfile.lastName}`;
        }
      } catch (err) {
        console.warn('Could not resolve user name, using UID:', err);
        // Fall back to UID if profile lookup fails
      }
    }

    await addDoc(collection(db, "activityLog"), {
      collection: collectionName,
      action,
      title,
      description,
      timestamp: serverTimestamp(),
      userId: userName, // Now contains full name instead of UID
      metadata
    });
    
    console.log(`✅ Activity logged: ${action} in ${collectionName} - ${title} by ${userName || 'unknown'}`);
  } catch (err) {
    console.error("❌ Failed to log activity:", err);
    // Don't throw - we don't want activity logging to break main functionality
  }
}

// Convenience functions for common actions
export async function logCreate(collectionName: string, title: string, userId?: string, metadata?: Record<string, unknown>) {
  return logActivity({
    collectionName,
    action: 'create',
    title,
    description: `New ${collectionName} created`,
    userId,
    metadata
  });
}

export async function logUpdate(collectionName: string, title: string, userId?: string, metadata?: Record<string, unknown>) {
  return logActivity({
    collectionName,
    action: 'update',
    title,
    description: `${collectionName} updated`,
    userId,
    metadata
  });
}

export async function logDelete(collectionName: string, title: string, userId?: string, metadata?: Record<string, unknown>) {
  return logActivity({
    collectionName,
    action: 'delete',
    title,
    description: `${collectionName} deleted`,
    userId,
    metadata
  });
}
