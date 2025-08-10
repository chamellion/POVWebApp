'use client';

import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Calendar, MapPin, Clock, ChevronDown, ChevronRight, Repeat, X, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { Event, RecurringEvent, getDocuments, deleteDocument, eventsCollection, getRecurringEvents, deleteRecurringEvent, generateUpcomingRecurringEvents } from '@/lib/firestore';
import EventForm from './EventForm';
import RecurringEventForm from './RecurringEventForm';
import SkipRecurringEventForm from './SkipRecurringEventForm';

type FilterType = 'all' | 'oneTime' | 'past' | 'recurring';

export default function EventsPage() {
  const { loading } = useProtectedRoute();
  const [events, setEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([]);
  const [upcomingRecurringEvents, setUpcomingRecurringEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingRecurringEvent, setEditingRecurringEvent] = useState<RecurringEvent | null>(null);
  const [skippingRecurringEvent, setSkippingRecurringEvent] = useState<RecurringEvent | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, recurringEventsData] = await Promise.all([
          getDocuments<Event>(eventsCollection),
          getRecurringEvents()
        ]);
        setEvents(eventsData);
        setRecurringEvents(recurringEventsData);
        
        // Generate upcoming recurring events
        const upcomingRecurring = await generateUpcomingRecurringEvents(recurringEventsData);
        setUpcomingRecurringEvents(upcomingRecurring);
      } catch {
        toast.error('Failed to fetch events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const refreshRecurringEvents = async () => {
    try {
      const upcomingRecurring = await generateUpcomingRecurringEvents(recurringEvents);
      setUpcomingRecurringEvents(upcomingRecurring);
    } catch {
      toast.error('Failed to refresh recurring events');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleEditRecurring = (event: RecurringEvent) => {
    setEditingRecurringEvent(event);
    setShowRecurringForm(true);
  };

  const handleSkipRecurring = (event: RecurringEvent) => {
    setSkippingRecurringEvent(event);
    setShowSkipForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDocument(eventsCollection, id);
        setEvents(events.filter(event => event.id !== id));
        toast.success('Event deleted successfully');
      } catch {
        toast.error('Failed to delete event');
      }
    }
  };

  const handleDeleteRecurring = async (event: RecurringEvent) => {
    if (confirm('Are you sure you want to delete this recurring event?')) {
      try {
        await deleteRecurringEvent(event);
        setRecurringEvents(recurringEvents.filter(e => e.id !== event.id));
        await refreshRecurringEvents();
        toast.success('Recurring event deleted successfully');
      } catch {
        toast.error('Failed to delete recurring event');
      }
    }
  };

  const handleFormSuccess = (event: Event) => {
    if (editingEvent) {
      setEvents(events.map(e => e.id === event.id ? event : e));
      setEditingEvent(null);
    } else {
      setEvents([event, ...events]);
    }
    setShowForm(false);
    toast.success(editingEvent ? 'Event updated successfully' : 'Event added successfully');
  };

  const handleRecurringFormSuccess = async (event: RecurringEvent) => {
    if (editingRecurringEvent) {
      setRecurringEvents(recurringEvents.map(e => e.id === event.id ? event : e));
      setEditingRecurringEvent(null);
    } else {
      setRecurringEvents([event, ...recurringEvents]);
    }
    setShowRecurringForm(false);
    await refreshRecurringEvents();
    toast.success(editingRecurringEvent ? 'Recurring event updated successfully' : 'Recurring event added successfully');
  };

  const handleSkipSuccess = () => {
    setShowSkipForm(false);
    setSkippingRecurringEvent(null);
    refreshRecurringEvents();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const getDayOfWeekName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Separate one-time events from recurring events
  const oneTimeEvents = events.filter(event => !event.id?.startsWith('recurring-'));
  
  // Combine all events for the "All Events" view
  const allEvents = [...oneTimeEvents, ...(upcomingRecurringEvents || [])].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Filter events based on active filter
  const getFilteredEvents = () => {
    switch (activeFilter) {
      case 'oneTime':
        return oneTimeEvents.filter(event => isUpcoming(event.date));
      case 'past':
        return oneTimeEvents.filter(event => !isUpcoming(event.date));
      case 'recurring':
        return upcomingRecurringEvents;
      default:
        return allEvents;
    }
  };

  const filteredEvents = getFilteredEvents();

  const getEmptyStateMessage = () => {
    switch (activeFilter) {
      case 'oneTime':
        return {
          title: 'No upcoming one-time events',
          description: 'Get started by adding your first church event.',
          action: () => setShowForm(true),
          actionText: 'Add Event'
        };
      case 'past':
        return {
          title: 'No past events',
          description: 'Past events will appear here once they\'ve occurred.',
          action: null,
          actionText: null
        };
      case 'recurring':
        return {
          title: 'No recurring events',
          description: 'Set up recurring events like Sunday services and Bible studies.',
          action: () => setShowRecurringForm(true),
          actionText: 'Add Recurring Event'
        };
      default:
        return {
          title: 'No events found',
          description: 'Get started by adding your first church event.',
          action: () => setShowForm(true),
          actionText: 'Add Event'
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  if (loading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-gray-600 mt-2">Manage church events and service times</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowRecurringForm(true)} variant="outline">
              <Repeat className="h-4 w-4 mr-2" />
              Add Recurring
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{allEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">One-time Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {oneTimeEvents.filter(e => isUpcoming(e.date)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Repeat className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Recurring</p>
                  <p className="text-2xl font-bold text-gray-900">{recurringEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Past Events</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {oneTimeEvents.filter(e => !isUpcoming(e.date)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="oneTime">One-time Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeFilter === 'all' && 'All Events'}
              {activeFilter === 'oneTime' && 'Upcoming One-time Events'}
              {activeFilter === 'past' && 'Past Events'}
              {activeFilter === 'recurring' && 'Recurring Events'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
                <p className="text-gray-500 mb-4">{emptyState.description}</p>
                {emptyState.action && (
                  <Button onClick={emptyState.action}>
                    <Plus className="h-4 w-4 mr-2" />
                    {emptyState.actionText}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => {
                    const isRecurring = event.id?.startsWith('recurring-');
                    const isExpanded = expandedRows.has(event.id!);
                    
                    return (
                      <React.Fragment key={event.id}>
                        <TableRow>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(event.id!)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{event.title}</p>
                              {isRecurring && (
                                <Badge variant="outline" className="text-xs">
                                  <Repeat className="h-3 w-3 mr-1" />
                                  Recurring
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(event.date)}
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-1" />
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isUpcoming(event.date) ? "default" : "secondary"}>
                              {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {!isRecurring && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(event)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {isRecurring && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const recurringEvent = recurringEvents.find(e => 
                                        event.id?.includes(e.id!)
                                      );
                                      if (recurringEvent) handleEditRecurring(recurringEvent);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const recurringEvent = recurringEvents.find(e => 
                                        event.id?.includes(e.id!)
                                      );
                                      if (recurringEvent) handleSkipRecurring(recurringEvent);
                                    }}
                                    title="Skip this occurrence"
                                  >
                                    <SkipForward className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (isRecurring) {
                                    const recurringEvent = recurringEvents.find(e => 
                                      event.id?.includes(e.id!)
                                    );
                                    if (recurringEvent) handleDeleteRecurring(recurringEvent);
                                  } else {
                                    handleDelete(event.id!);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-gray-50">
                              <div className="p-4">
                                <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
                                <p className="text-gray-600 mb-3">{event.description}</p>
                                {isRecurring && (
                                  <div className="text-sm text-gray-500">
                                    <p>This is a recurring event that occurs every {getDayOfWeekName(
                                      recurringEvents.find(e => event.id?.includes(e.id!))?.dayOfWeek || 0
                                    )}.</p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialogs */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      {showRecurringForm && (
        <RecurringEventForm
          event={editingRecurringEvent}
          onSuccess={handleRecurringFormSuccess}
          onCancel={() => {
            setShowRecurringForm(false);
            setEditingRecurringEvent(null);
          }}
        />
      )}

      {showSkipForm && skippingRecurringEvent && (
        <SkipRecurringEventForm
          recurringEvent={skippingRecurringEvent}
          onSuccess={handleSkipSuccess}
          onCancel={() => {
            setShowSkipForm(false);
            setSkippingRecurringEvent(null);
          }}
        />
      )}
    </DashboardLayout>
  );
} 