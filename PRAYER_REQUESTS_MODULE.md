# Prayer Requests Management Module

## Overview

The Prayer Requests Management module provides comprehensive functionality for church administrators to manage prayer requests submitted through the client website. This module follows the same design patterns and architecture as the Testimonies module, ensuring consistency across the admin dashboard.

## Features

### 🔍 **Data Management**
- **Real-time Updates**: Live synchronization with Firestore using real-time listeners
- **CRUD Operations**: Full Create, Read, Update, Delete functionality (except Create - handled by client app)
- **Bulk Operations**: Select multiple requests for batch actions (mark as read, delete)

### 📊 **Dashboard Features**
- **Statistics Cards**: Total requests, unread count, named vs anonymous breakdown
- **Advanced Filtering**: Search by text, filter by type (anonymous/named, read/unread), date range filtering
- **Responsive Table**: Expandable rows for long prayer requests, status indicators, action buttons

### 📤 **Export Functionality**
- **PDF Export**: Generate PDF documents with prayer request details
- **Word Export**: Create Word documents (.docx) for easy sharing
- **Export History**: Track all export activities with detailed logging
- **Audit Trail**: Log all export actions with admin information and timestamps

### 🔔 **Notification System**
- **Unread Badge**: Shows count of unread prayer requests in sidebar
- **Real-time Updates**: Badge updates automatically when requests are marked as read
- **Visual Indicators**: Unread requests highlighted with orange background

## Technical Implementation

### **Data Structure**

```typescript
interface PrayerRequest {
  id?: string;
  name: string | null;        // null if anonymous
  email: string | null;       // null if anonymous
  request: string;            // required prayer request text
  isAnonymous: boolean;
  isRead: boolean;            // default false
  readBy?: string;            // admin userId who marked as read
  readAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

### **Firestore Collections**
- `prayerRequests` - Main prayer requests data
- `prayer_requests_exports` - Export audit logs

### **Key Functions**
- `getPrayerRequestsWithFilters()` - Fetch with search/filter support
- `markPrayerRequestAsRead()` - Mark individual request as read
- `markMultiplePrayerRequestsAsRead()` - Bulk mark as read
- `subscribeToPrayerRequests()` - Real-time updates
- `getUnreadPrayerRequestsCount()` - Notification badge count

### **Export System**
- **PDF Generation**: Uses pdfmake library (same as testimonies)
- **Word Generation**: Uses docx library for .docx files
- **File Naming**: `prayer_requests_YYYY-MM-DD.pdf/docx`
- **Audit Logging**: All exports logged to Firestore with admin details

## User Interface

### **Main Dashboard**
- **Header**: Title, description, action buttons (Export, bulk actions)
- **Stats Cards**: 4 cards showing key metrics
- **Filters Panel**: Search, type filter, date range
- **Data Table**: Sortable columns with expandable rows
- **Export History**: Tabular view of all export activities

### **Edit Form**
- **Anonymous Toggle**: Switch between named and anonymous
- **Dynamic Fields**: Name/email fields appear/disappear based on anonymous status
- **Request Text**: Large textarea for prayer request content
- **Read Status**: Checkbox to mark as read/unread

### **Responsive Design**
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large buttons and touch targets
- **Progressive Enhancement**: Core functionality works without JavaScript

## Security & Permissions

### **Firestore Rules**
```javascript
// Prayer requests collection - authenticated access only
match /prayerRequests/{document} {
  allow read, write: if request.auth != null;
}

// Prayer requests exports collection - authenticated access only
match /prayer_requests_exports/{document} {
  allow read, write: if request.auth != null;
}
```

### **Access Control**
- **Authentication Required**: All operations require valid user session
- **Admin Only**: Dashboard access restricted to authenticated users
- **Audit Logging**: All actions logged with user ID and timestamp

## Integration Points

### **Dashboard Layout**
- **Sidebar Menu**: Added "Prayer Requests" item with notification badge
- **Real-time Updates**: Badge count updates automatically
- **Navigation**: Seamless integration with existing dashboard structure

### **Export System**
- **Shared Components**: Uses same ExportModal and ExportHistory components
- **Type Safety**: Handles both testimonies and prayer requests
- **Consistent UX**: Same export workflow and user experience

### **Notification System**
- **Badge Display**: Shows unread count in sidebar
- **Auto-Update**: Count updates in real-time
- **Visual Consistency**: Same styling as testimonies and newsletter badges

## Usage Instructions

### **For Administrators**

1. **Access Dashboard**
   - Navigate to `/dashboard/prayer-requests`
   - View prayer requests in real-time

2. **Manage Requests**
   - **View**: Click on truncated text to expand full request
   - **Edit**: Click edit button to modify request details
   - **Mark as Read**: Use eye icon to mark as read/unread
   - **Delete**: Remove requests with confirmation dialog

3. **Bulk Operations**
   - Select multiple requests using checkboxes
   - Use "Select All" for entire filtered list
   - Perform batch mark as read or delete operations

4. **Export Data**
   - Click "Export" button
   - Choose format (PDF/Word)
   - Select specific requests or export all
   - Download generated file

5. **Filter & Search**
   - Use search box for text-based filtering
   - Apply type filters (anonymous, named, read, unread)
   - Set date ranges for temporal filtering

### **For Developers**

1. **Adding New Features**
   - Follow existing patterns in `src/app/dashboard/prayer-requests/`
   - Use shared UI components from `src/components/ui/`
   - Update Firestore rules for new collections

2. **Modifying Export Logic**
   - Update `src/lib/utils/exportUtils.ts` for new formats
   - Modify `ExportModal` component for new export types
   - Update audit logging in Firestore functions

3. **Extending Data Model**
   - Add fields to `PrayerRequest` interface
   - Update Firestore rules for new fields
   - Modify UI components to display new data

## File Structure

```
src/
├── app/dashboard/prayer-requests/
│   ├── page.tsx              # Main dashboard page
│   └── PrayerRequestForm.tsx # Edit form component
├── components/ui/
│   ├── ExportModal.tsx       # Export functionality
│   └── ExportHistory.tsx     # Export audit display
├── lib/
│   ├── firestore.ts          # Data models and functions
│   └── utils/exportUtils.ts  # Export generation logic
└── components/layout/
    └── DashboardLayout.tsx   # Sidebar integration
```

## Configuration

### **Environment Variables**
- No additional environment variables required
- Uses existing Firebase configuration
- Inherits export settings from testimonies module

### **Firestore Setup**
- Collections created automatically on first use
- Rules deployed via `firebase deploy --only firestore:rules`
- Indexes created automatically for queries

### **Export Libraries**
- **PDF**: pdfmake (bundled with application)
- **Word**: docx (bundled with application)
- **No external dependencies** required

## Performance Considerations

### **Real-time Updates**
- Efficient Firestore listeners with proper cleanup
- Debounced search to reduce API calls
- Optimized re-renders using React best practices

### **Data Loading**
- Lazy loading of export history
- Pagination for large datasets (future enhancement)
- Efficient filtering on client-side for small datasets

### **Export Performance**
- Asynchronous PDF/Word generation
- Progress indicators for long operations
- Background processing for large exports

## Future Enhancements

### **Planned Features**
- **Email Notifications**: Alert admins of new requests
- **Request Categories**: Organize by prayer type/topic
- **Response Tracking**: Log admin responses to requests
- **Bulk Import**: CSV import for historical data

### **Technical Improvements**
- **Caching**: Redis for frequently accessed data
- **Search Indexing**: Full-text search capabilities
- **API Endpoints**: RESTful API for external integrations
- **Webhook Support**: Real-time notifications to external systems

## Troubleshooting

### **Common Issues**

1. **Prayer Requests Not Loading**
   - Check Firestore rules deployment
   - Verify Firebase configuration
   - Check browser console for errors

2. **Export Failures**
   - Ensure PDF libraries are loaded
   - Check file permissions
   - Verify export options configuration

3. **Real-time Updates Not Working**
   - Check Firestore listener setup
   - Verify authentication state
   - Check network connectivity

### **Debug Information**
- Console logging for all major operations
- Error boundaries for graceful failure handling
- Detailed error messages with actionable guidance

## Support & Maintenance

### **Monitoring**
- Export success/failure rates
- User interaction patterns
- Performance metrics

### **Updates**
- Regular dependency updates
- Security patches
- Feature enhancements

### **Documentation**
- API documentation for developers
- User guides for administrators
- Troubleshooting guides for support teams

---

*This module provides a robust, scalable solution for managing prayer requests in church administration systems, with a focus on user experience, security, and maintainability.*
