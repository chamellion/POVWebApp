'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryItem, createDocument, updateDocument, galleryCollection } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';

const categories = [
  'Food Drive',
  'Care Home',
  'Youth Ministry',
  'Sunday Service',
  'Community Outreach',
  'Bible Study',
  'Prayer Meeting',
  'Other'
];

const gallerySchema = z.object({
  caption: z.string().min(1, 'Caption is required'),
  category: z.string().min(1, 'Category is required'),
});

type GalleryFormData = z.infer<typeof gallerySchema>;

interface GalleryFormProps {
  item?: GalleryItem | null;
  onSuccess: (item: GalleryItem) => void;
  onCancel: () => void;
}

export default function GalleryForm({ item, onSuccess, onCancel }: GalleryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(item?.imageUrl || '');
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      caption: item?.caption || '',
      category: item?.category || '',
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

  const onSubmit = async (data: GalleryFormData) => {
    if (!imagePreview && !item?.imageUrl) {
      toast.error('Please select an image');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = item?.imageUrl || '';

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(
          imageFile,
          'gallery',
          (progress) => setUploadProgress(progress)
        );
      }

      const galleryData = {
        ...data,
        imageUrl,
      };

      if (item?.id) {
        // Update existing item
        await updateDocument(galleryCollection, item.id, galleryData);
        onSuccess({ ...item, ...galleryData });
      } else {
        // Create new item
        const id = await createDocument(galleryCollection, galleryData);
        onSuccess({ id, ...galleryData });
      }
    } catch {
      toast.error('Failed to save gallery item');
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
            {item ? 'Edit Photo' : 'Upload New Photo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
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
                  id="image-upload"
                />
                <Label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Select Image'}
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

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              placeholder="Describe this photo..."
              {...form.register('caption')}
            />
            {form.formState.errors.caption && (
              <p className="text-sm text-red-500">
                {form.formState.errors.caption.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value) => form.setValue('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (item ? 'Update Photo' : 'Upload Photo')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 