import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function getRelativeTime(timestamp: Timestamp): string {
  try {
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown time';
  }
}

export function getRelativeTimeFromDate(date: Date): string {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown time';
  }
}
