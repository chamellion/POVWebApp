'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PrayerRequest, updateDocument, prayerRequestsCollection } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface PrayerRequestFormProps {
  prayerRequest: PrayerRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PrayerRequestForm({ 
  prayerRequest, 
  isOpen, 
  onClose, 
  onSuccess 
}: PrayerRequestFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    request: '',
    isAnonymous: false,
    isRead: false
  });

  useEffect(() => {
    if (prayerRequest) {
      setFormData({
        name: prayerRequest.name || '',
        email: prayerRequest.email || '',
        request: prayerRequest.request || '',
        isAnonymous: prayerRequest.isAnonymous || false,
        isRead: prayerRequest.isRead || false
      });
    }
  }, [prayerRequest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prayerRequest?.id || !user) return;

    if (!formData.request.trim()) {
      toast.error('Prayer request text is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: Partial<PrayerRequest> = {
        request: formData.request.trim(),
        isAnonymous: formData.isAnonymous,
        isRead: formData.isRead
      };

      // Only update name and email if not anonymous
      if (!formData.isAnonymous) {
        updateData.name = formData.name.trim() || null;
        updateData.email = formData.email.trim() || null;
      } else {
        updateData.name = null;
        updateData.email = null;
      }

      await updateDocument(prayerRequestsCollection, prayerRequest.id, updateData);
      
      toast.success('Prayer request updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update prayer request:', error);
      toast.error('Failed to update prayer request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Prayer Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isAnonymous" className="text-sm font-medium">
              Anonymous Request
            </Label>
            <Switch
              id="isAnonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) => handleInputChange('isAnonymous', checked)}
            />
          </div>

          {/* Name Field */}
          {!formData.isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter name"
                disabled={formData.isAnonymous}
              />
            </div>
          )}

          {/* Email Field */}
          {!formData.isAnonymous && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={formData.isAnonymous}
              />
            </div>
          )}

          {/* Prayer Request Text */}
          <div className="space-y-2">
            <Label htmlFor="request">Prayer Request *</Label>
            <Textarea
              id="request"
              value={formData.request}
              onChange={(e) => handleInputChange('request', e.target.value)}
              placeholder="Enter the prayer request..."
              rows={6}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is the main prayer request text that will be displayed.
            </p>
          </div>

          {/* Read Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRead"
              checked={formData.isRead}
              onCheckedChange={(checked) => handleInputChange('isRead', checked)}
            />
            <Label htmlFor="isRead" className="text-sm font-medium">
              Mark as Read
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.request.trim()}
            >
              {isSubmitting ? 'Updating...' : 'Update Prayer Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
