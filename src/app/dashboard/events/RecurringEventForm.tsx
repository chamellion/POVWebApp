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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RecurringEvent, createRecurringEvent, updateRecurringEvent } from '@/lib/firestore';

const recurringEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  dayOfWeek: z.number().min(0).max(6, 'Day of week must be between 0 and 6'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isActive: z.boolean(),
});

type RecurringEventFormData = z.infer<typeof recurringEventSchema>;

interface RecurringEventFormProps {
  event?: RecurringEvent | null;
  onSuccess: (event: RecurringEvent) => void;
  onCancel: () => void;
}

const dayOfWeekOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function RecurringEventForm({ event, onSuccess, onCancel }: RecurringEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RecurringEventFormData>({
    resolver: zodResolver(recurringEventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      location: event?.location || '',
      dayOfWeek: event?.dayOfWeek ?? 0,
      startTime: event?.startTime || '',
      endTime: event?.endTime || '',
      isActive: event?.isActive ?? true,
    },
  });

  const onSubmit = async (data: RecurringEventFormData) => {
    setIsLoading(true);
    try {
      if (event?.id) {
        // Update existing event
        await updateRecurringEvent({ ...event, ...data });
        onSuccess({ ...event, ...data });
      } else {
        // Create new event
        const id = await createRecurringEvent(data);
        onSuccess({ id, ...data });
      }
    } catch {
      toast.error('Failed to save recurring event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Recurring Event' : 'Add New Recurring Event'}
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

          {/* Day of Week */}
          <div className="space-y-2">
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select
              value={form.watch('dayOfWeek').toString()}
              onValueChange={(value) => form.setValue('dayOfWeek', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day of week" />
              </SelectTrigger>
              <SelectContent>
                {dayOfWeekOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.dayOfWeek && (
              <p className="text-sm text-red-500">
                {form.formState.errors.dayOfWeek.message}
              </p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Active</Label>
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
