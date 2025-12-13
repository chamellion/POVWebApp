# Events Management System Enhancements

This document outlines the enhancements implemented for the Events Management system in the Church Dashboard.

## 🎯 Overview

The Events Management system has been significantly enhanced with the following new features:

1. **Recurring Events Management**
2. **Newsletter Signup Management**
3. **Real-time Notifications**
4. **Enhanced UI/UX with Filtering and Expandable Rows**

## 🔄 Recurring Events

### Features
- **Firestore Storage**: All recurring events are now stored in Firestore instead of being generated in code
- **Collection**: `recurringEvents`
- **Data Structure**:
  ```typescript
  {
    title: string;
    description: string;
    location: string;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string; // e.g. "09:30"
    endTime: string;   // e.g. "11:00"
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }
  ```

### Functionality
- **CRUD Operations**: Create, read, update, and delete recurring events
- **Automatic Generation**: Upcoming events are automatically generated from recurring events
- **Active/Inactive Toggle**: Enable or disable recurring events
- **Day of Week Selection**: Choose which day of the week the event occurs
- **Time Management**: Set start and end times for each recurring event

### Usage
1. Navigate to Events page
2. Click "Add Recurring" button
3. Fill in event details including day of week
4. Set active status
5. Save the recurring event

## 📧 Newsletter Signup Management

### Features
- **New Collection**: `newsletterSignups` in Firestore
- **Data Structure**:
  ```typescript
  {
    email: string;
    createdAt: Timestamp;
  }
  ```

### Functionality
- **Real-time Updates**: Live updates when new signups occur
- **Notification Badges**: Badge count in sidebar shows new signups
- **Export Functionality**: Export signups to CSV
- **Mark as Viewed**: Track which signups have been viewed
- **Local Storage**: Persist last viewed timestamp per admin

### Usage
1. Navigate to Newsletter page in sidebar
2. View all signups with timestamps
3. Use "Mark as Viewed" to clear notifications
4. Export data using "Export CSV" button
5. Delete individual signups as needed

## 🔔 Real-time Notifications

### Features
- **Top-bar Notification Icon**: Bell icon with badge count
- **Sidebar Badge**: Newsletter menu item shows unread count
- **Toast Notifications**: Real-time alerts for new signups
- **Firestore Listeners**: Uses `onSnapshot` for live updates

### Implementation
- Notifications appear when new newsletter signups are added
- Badge counts reset when newsletter page is opened
- Local storage tracks last viewed timestamp
- Real-time updates across all dashboard pages

## 🎨 Enhanced UI/UX

### Filtering System
- **All Events**: Shows all events (one-time + recurring)
- **Upcoming Events**: Shows only future events
- **Past Events**: Shows only past events
- **Recurring Events**: Shows only recurring events

### Expandable Table Rows
- Click chevron icon to expand/collapse event details
- Shows full event description
- Displays additional info for recurring events

### Improved Statistics
- **Total Events**: Combined count of all events
- **Upcoming Events**: Count of future events
- **Recurring Events**: Count of recurring event templates
- **One-time Events**: Count of individual events

### Visual Enhancements
- **Recurring Badge**: Visual indicator for recurring events
- **Status Badges**: Upcoming/Past status indicators
- **Action Buttons**: Edit and delete for both event types
- **Responsive Design**: Works on mobile and desktop

## 🛠 Technical Implementation

### New Files Created
- `src/app/dashboard/events/RecurringEventForm.tsx` - Form for recurring events
- `src/app/dashboard/newsletter/page.tsx` - Newsletter signups page
- `scripts/add-test-data.js` - Test data script

### Updated Files
- `src/lib/firestore.ts` - Added new interfaces and functions
- `src/app/dashboard/events/page.tsx` - Enhanced with filtering and recurring events
- `src/components/layout/DashboardLayout.tsx` - Added newsletter menu and notifications

### New Firestore Collections
- `recurringEvents` - Stores recurring event templates
- `newsletterSignups` - Stores newsletter subscriptions

### New Functions Added
- `getRecurringEvents()` - Fetch recurring events
- `createRecurringEvent()` - Create new recurring event
- `updateRecurringEvent()` - Update existing recurring event
- `deleteRecurringEvent()` - Delete recurring event
- `getNewsletterSignups()` - Fetch newsletter signups
- `createNewsletterSignup()` - Create new signup
- `deleteNewsletterSignup()` - Delete signup
- `subscribeToNewsletterSignups()` - Real-time listener
- `generateUpcomingRecurringEvents()` - Generate future events from templates

## 🧪 Testing

### Test Data Script
Run the following command to add test data:
```bash
npm run add-test-data
```

This will add:
- 4 sample recurring events (Sunday Service, Wednesday Bible Study, Friday Prayer Meeting, Youth Group)
- 5 sample newsletter signups with different timestamps

### Verification Checklist
- [ ] Recurring events appear in dashboard
- [ ] Newsletter signups are stored and displayed
- [ ] Notifications trigger correctly for new signups
- [ ] Badge counts reset when newsletter page is opened
- [ ] Filtering works for all event types
- [ ] Expandable rows show full event details
- [ ] CRUD operations work for both event types
- [ ] Real-time updates function properly

## 🔧 Configuration

### Environment Variables
Ensure your Firebase configuration is properly set up in your environment variables:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firestore Rules
Make sure your Firestore security rules allow read/write access to the new collections:
- `recurringEvents`
- `newsletterSignups`

## 🚀 Deployment

The enhancements are ready for deployment and include:
- All necessary TypeScript types
- Proper error handling
- Loading states
- Form validation
- Responsive design
- Accessibility features

## 📝 Notes

- Recurring events are automatically generated for the next 4 weeks
- Newsletter notifications are per-admin (stored in localStorage)
- All CRUD operations update the UI instantly without page reloads
- The system maintains backward compatibility with existing events
