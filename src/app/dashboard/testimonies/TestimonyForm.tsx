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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Testimony, createDocument, updateDocument, testimoniesCollection } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';

const testimonySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  story: z.string().min(20, 'Story must be at least 20 characters'),
});

type TestimonyFormData = z.infer<typeof testimonySchema>;

interface TestimonyFormProps {
  testimony?: Testimony | null;
  onSuccess: (testimony: Testimony) => void;
  onCancel: () => void;
}

export default function TestimonyForm({ testimony, onSuccess, onCancel }: TestimonyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(testimony?.photo || '');
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<TestimonyFormData>({
    resolver: zodResolver(testimonySchema),
    defaultValues: {
      name: testimony?.name || '',
      story: testimony?.story || '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const onSubmit = async (data: TestimonyFormData) => {
    setIsLoading(true);
    try {
      let photoUrl = testimony?.photo || '';

      // Upload new image if selected
      if (imageFile) {
        photoUrl = await uploadImage(
          imageFile,
          'testimonies',
          (progress) => setUploadProgress(progress)
        );
      }

      const testimonyData = {
        ...data,
        photo: photoUrl,
      };

      if (testimony?.id) {
        // Update existing testimony
        await updateDocument(testimoniesCollection, testimony.id, testimonyData);
        onSuccess({ ...testimony, ...testimonyData });
      } else {
        // Create new testimony
        const id = await createDocument(testimoniesCollection, testimonyData);
        onSuccess({ id, ...testimonyData });
      }
    } catch {
      toast.error('Failed to save testimony');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {testimony ? 'Edit Testimony' : 'Add New Testimony'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Member Name</Label>
            <Input
              id="name"
              placeholder="Enter member's full name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Photo Upload (Optional) */}
          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreview} />
                    <AvatarFallback>
                      {form.watch('name')?.split(' ').map(n => n[0]).join('') || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="photo-upload"
                />
                <Label
                  htmlFor="photo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </Label>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>

          {/* Story */}
          <div className="space-y-2">
            <Label htmlFor="story">Testimony Story</Label>
            <Textarea
              id="story"
              placeholder="Share the member's testimony or story..."
              rows={6}
              {...form.register('story')}
            />
            {form.formState.errors.story && (
              <p className="text-sm text-red-500">
                {form.formState.errors.story.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (testimony ? 'Update Testimony' : 'Add Testimony')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 