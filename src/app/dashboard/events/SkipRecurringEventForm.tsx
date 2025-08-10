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
import { toast } from 'sonner';
import { RecurringEvent, SkippedRecurringEvent, createSkippedRecurringEvent } from '@/lib/firestore';

const skipEventSchema = z.object({
  skipDate: z.string().min(1, 'Skip date is required'),
  reason: z.string().optional(),
});

type SkipEventFormData = z.infer<typeof skipEventSchema>;

interface SkipRecurringEventFormProps {
  recurringEvent: RecurringEvent;
  onSuccess: () => void;
  onCancel: () => void;
}

const getDayOfWeekName = (dayOfWeek: number) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

export default function SkipRecurringEventForm({ recurringEvent, onSuccess, onCancel }: SkipRecurringEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SkipEventFormData>({
    resolver: zodResolver(skipEventSchema),
    defaultValues: {
      skipDate: '',
      reason: '',
    },
  });

  const onSubmit = async (data: SkipEventFormData) => {
    setIsLoading(true);
    try {
      await createSkippedRecurringEvent({
        recurringEventId: recurringEvent.id!,
        skipDate: data.skipDate,
        reason: data.reason || undefined,
      });
      onSuccess();
      toast.success(`Skipped ${recurringEvent.title} for ${data.skipDate}`);
    } catch {
      toast.error('Failed to skip recurring event');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate next few occurrences of this recurring event for date selection
  const generateNextOccurrences = () => {
    const occurrences = [];
    const today = new Date();
    const currentDate = new Date(today);
    
    // Find the next occurrence of this day of week
    while (currentDate.getDay() !== recurringEvent.dayOfWeek) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Generate next 8 occurrences
    for (let i = 0; i < 8; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const displayDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      occurrences.push({
        value: dateStr,
        label: displayDate,
      });
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return occurrences;
  };

  const nextOccurrences = generateNextOccurrences();

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Skip Recurring Event</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">{recurringEvent.title}</h4>
          <p className="text-sm text-gray-600">
            Every {getDayOfWeekName(recurringEvent.dayOfWeek)} at {recurringEvent.startTime} - {recurringEvent.endTime}
          </p>
          <p className="text-sm text-gray-600">{recurringEvent.location}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Skip Date */}
          <div className="space-y-2">
            <Label htmlFor="skipDate">Skip Date</Label>
            <Select
              value={form.watch('skipDate')}
              onValueChange={(value) => form.setValue('skipDate', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date to skip" />
              </SelectTrigger>
              <SelectContent>
                {nextOccurrences.map((occurrence) => (
                  <SelectItem key={occurrence.value} value={occurrence.value}>
                    {occurrence.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.skipDate && (
              <p className="text-sm text-red-500">
                {form.formState.errors.skipDate.message}
              </p>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Holiday, Special event, Maintenance"
              rows={3}
              {...form.register('reason')}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-500">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} variant="destructive">
              {isLoading ? 'Skipping...' : 'Skip Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
