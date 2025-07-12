'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Event, createDocument, updateDocument, eventsCollection } from '@/lib/firestore';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event | null;
  onSuccess: (event: Event) => void;
  onCancel: () => void;
}

export default function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      date: event?.date || '',
      startTime: event?.startTime || '',
      endTime: event?.endTime || '',
      location: event?.location || '',
      description: event?.description || '',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      if (event?.id) {
        // Update existing event
        await updateDocument(eventsCollection, event.id, data);
        onSuccess({ ...event, ...data });
      } else {
        // Create new event
        const id = await createDocument(eventsCollection, data);
        onSuccess({ id, ...data });
      }
    } catch {
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              placeholder="Enter event title"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...form.register('date')}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                {...form.register('startTime')}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Main Sanctuary, Fellowship Hall"
              {...form.register('location')}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-500">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the event..."
              rows={4}
              {...form.register('description')}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (event ? 'Update Event' : 'Add Event')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 