# Calendar Export and Recurring Events Logic - Backup for Client App

This file contains the calendar export and recurring events functionality that was removed from the dashboard app. This logic should be implemented in the client-facing app instead.

## 📁 Required Files

### 1. Calendar Utility (`src/lib/utils/calendar.ts`)

```typescript
import { createEvent } from 'ics';

export interface CalendarEvent {
  id?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  isRecurring?: boolean;
  recurringType?: 'weekly' | 'monthly';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type ExportFilter = 'this-month' | 'next-month' | 'custom-range';

// Get date range for different filter options
export function getDateRange(filter: ExportFilter, customRange?: DateRange): DateRange {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  switch (filter) {
    case 'this-month':
      return {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      };
    case 'next-month':
      return {
        start: new Date(currentYear, currentMonth + 1, 1),
        end: new Date(currentYear, currentMonth + 2, 0, 23, 59, 59)
      };
    case 'custom-range':
      return customRange || {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      };
    default:
      return {
        start: new Date(currentYear, currentMonth, 1),
        end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
      };
  }
}

// Filter events by date range
export function filterEventsByDateRange(events: CalendarEvent[], dateRange: DateRange): CalendarEvent[] {
  return events.filter(event => {
    const eventDate = new Date(`${event.date}T${event.startTime}`);
    return eventDate >= dateRange.start && eventDate <= dateRange.end;
  });
}

// Generate Google Calendar URL for multiple events
export function generateGoogleCalendarLinkForRange(events: CalendarEvent[], dateRange: DateRange): string {
  const filteredEvents = filterEventsByDateRange(events, dateRange);
  
  if (filteredEvents.length === 0) {
    throw new Error('No events available for the selected range');
  }
  
  // For multiple events, we'll create a single Google Calendar event with all events listed
  const eventTitles = filteredEvents.map(e => e.title).join(', ');
  const eventDescriptions = filteredEvents.map(e => 
    `${e.title} - ${e.date} ${e.startTime}-${e.endTime} at ${e.location}\n${e.description}`
  ).join('\n\n');
  
  const startDate = dateRange.start;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1); // End at start of next day
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Church Events - ${eventTitles}`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: eventDescriptions,
    location: 'Church Events',
  });
  
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// Generate Google Calendar URL for single event
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const startDate = new Date(`${event.date}T${event.startTime}`);
  const endDate = new Date(`${event.date}T${event.endTime}`);
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: event.description,
    location: event.location,
  });
  
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

// Generate iCal file for multiple events
export async function generateICalFileForRange(events: CalendarEvent[], dateRange: DateRange): Promise<Blob> {
  const filteredEvents = filterEventsByDateRange(events, dateRange);
  
  if (filteredEvents.length === 0) {
    throw new Error('No events available for the selected range');
  }
  
  // Create individual iCal events and combine them
  const icsEvents = filteredEvents.map(event => {
    const startDate = new Date(`${event.date}T${event.startTime}`);
    const endDate = new Date(`${event.date}T${event.endTime}`);
    
    return {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ] as [number, number, number, number, number],
      end: [
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      ] as [number, number, number, number, number],
      title: event.title,
      description: event.description,
      location: event.location,
    };
  });
  
  // Create multiple events - the ics library supports arrays
  const { error, value } = createEvent(icsEvents as unknown as Parameters<typeof createEvent>[0]);
  
  if (error) {
    throw new Error('Failed to generate iCal file');
  }
  
  return new Blob([value || ''], { type: 'text/calendar' });
}

// Generate iCal file for single event
export async function generateICalFile(event: CalendarEvent): Promise<Blob> {
  const startDate = new Date(`${event.date}T${event.startTime}`);
  const endDate = new Date(`${event.date}T${event.endTime}`);
  
  const icsEvent = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ] as [number, number, number, number, number],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ] as [number, number, number, number, number],
    title: event.title,
    description: event.description,
    location: event.location,
  };
  
  const { error, value } = createEvent(icsEvent);
  
  if (error) {
    throw new Error('Failed to generate iCal file');
  }
  
  return new Blob([value || ''], { type: 'text/calendar' });
}

// Download iCal file for single event
export function downloadICalFile(event: CalendarEvent): void {
  generateICalFile(event)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error('Error generating iCal file:', error);
      throw error;
    });
}

// Download iCal file for date range
export function downloadICalFileForRange(events: CalendarEvent[], dateRange: DateRange): void {
  generateICalFileForRange(events, dateRange)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const startDate = dateRange.start.toISOString().split('T')[0];
      const endDate = dateRange.end.toISOString().split('T')[0];
      link.download = `church_events_${startDate}_to_${endDate}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error('Error generating iCal file:', error);
      throw error;
    });
}

// Generate recurring events for the next 6 months
export function generateRecurringEvents(): CalendarEvent[] {
  const recurringEvents: CalendarEvent[] = [];
  const now = new Date();
  const sixMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
  
  // Sunday Service (every Sunday at 9:00 AM - 11:00 AM)
  const sundayService: CalendarEvent = {
    title: 'Sunday Service',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Main Sanctuary',
    description: 'Join us for our weekly Sunday service featuring worship, prayer, and an inspiring message from God\'s Word.',
    isRecurring: true,
    recurringType: 'weekly',
  };
  
  // Wednesday Bible Study (every Wednesday at 7:00 PM - 8:30 PM)
  const wednesdayBibleStudy: CalendarEvent = {
    title: 'Wednesday Bible Study',
    date: '',
    startTime: '19:00',
    endTime: '20:30',
    location: 'Fellowship Hall',
    description: 'Midweek Bible study and prayer meeting. Come grow deeper in your faith through God\'s Word.',
    isRecurring: true,
    recurringType: 'weekly',
  };
  
  // Friday Prayer Meeting (every Friday at 6:00 PM - 7:00 PM)
  const fridayPrayer: CalendarEvent = {
    title: 'Friday Prayer Meeting',
    date: '',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Prayer Room',
    description: 'Join us for our weekly prayer meeting. Let\'s come together to pray for our church, community, and world.',
    isRecurring: true,
    recurringType: 'weekly',
  };
  
  // Generate dates for each recurring event
  const currentDate = new Date(now);
  
  while (currentDate <= sixMonthsFromNow) {
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Sunday Service (day 0)
    if (dayOfWeek === 0) {
      recurringEvents.push({
        ...sundayService,
        date: dateString,
      });
    }
    
    // Wednesday Bible Study (day 3)
    if (dayOfWeek === 3) {
      recurringEvents.push({
        ...wednesdayBibleStudy,
        date: dateString,
      });
    }
    
    // Friday Prayer Meeting (day 5)
    if (dayOfWeek === 5) {
      recurringEvents.push({
        ...fridayPrayer,
        date: dateString,
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return recurringEvents;
}

// Combine Firestore events with recurring events and sort by date
export function combineAndSortEvents(firestoreEvents: CalendarEvent[]): CalendarEvent[] {
  const recurringEvents = generateRecurringEvents();
  const allEvents = [...firestoreEvents, ...recurringEvents];
  
  return allEvents.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`);
    const dateB = new Date(`${b.date}T${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });
}

// Format date range for display
export function formatDateRange(dateRange: DateRange): string {
  const startDate = dateRange.start.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
  const endDate = dateRange.end.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  });
  
  if (startDate === endDate) {
    return startDate;
  }
  
  return `${startDate} - ${endDate}`;
}
```

## 📦 Required Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "ics": "^3.8.1"
  }
}
```

## 🎨 UI Components for Client App

### Export Filter Panel Component

```tsx
// Export Filter Panel Component
<Card>
  <CardHeader>
    <CardTitle className="flex items-center space-x-2">
      <Filter className="h-5 w-5" />
      <span>Export Calendar</span>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="export-filter">Date Range</Label>
          <Select value={exportFilter} onValueChange={handleFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="next-month">Next Month</SelectItem>
              <SelectItem value="custom-range">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {showCustomRange && (
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                onChange={(e) => handleCustomRangeChange('start', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                onChange={(e) => handleCustomRangeChange('end', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {getFilteredEventsCount()} events in selected range
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleBulkGoogleCalendarExport}
            disabled={getFilteredEventsCount() === 0}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Export to Google Calendar
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkICalExport}
            disabled={getFilteredEventsCount() === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download iCal File
          </Button>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Event Row with Export Buttons

```tsx
// Event row with export buttons
<TableCell>
  <div className="flex items-center space-x-2">
    {/* Calendar Export Buttons */}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleGoogleCalendarExport(event)}
      title="Add to Google Calendar"
    >
      <ExternalLink className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleICalExport(event)}
      title="Download iCal file"
    >
      <Download className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

## 🔧 Implementation Notes

1. **Install Dependencies**: Run `npm install ics` to add the iCal generation library
2. **Import Functions**: Import the calendar utility functions in your client app
3. **State Management**: Add state for export filters and custom date ranges
4. **Error Handling**: Implement proper error handling for export operations
5. **Recurring Events**: Use `combineAndSortEvents()` to merge Firestore events with recurring events
6. **UI Integration**: Add the export filter panel and export buttons to your events page

## 📋 Key Features to Implement

- **Month-based Export**: Filter events by current month, next month, or custom range
- **Recurring Services**: Automatically generate Sunday, Wednesday, and Friday services
- **Google Calendar Integration**: Direct export to Google Calendar
- **iCal Export**: Download .ics files for Apple Calendar, Outlook, etc.
- **Real-time Filtering**: Show event count for selected date range
- **Error Handling**: Graceful handling when no events exist in range

This backup contains all the necessary code and components to implement the calendar export and recurring events functionality in the client-facing app. 