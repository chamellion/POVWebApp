'use client';

import { useState, useEffect } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Leader, createLeader, updateLeader, getLeadersByCategory } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';

const leaderSchema = z.object({
  customId: z.number().min(1, 'Custom ID must be at least 1').optional(),
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  category: z.enum(['pastor', 'teamLead']),
  isActive: z.boolean(),
});

type LeaderFormData = z.infer<typeof leaderSchema>;

interface LeaderFormProps {
  leader?: Leader | null;
  defaultCategory?: 'pastor' | 'teamLead';
  onSuccess: (leader: Leader) => void;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'pastor', label: 'Pastor', icon: '👨‍💼' },
  { value: 'teamLead', label: 'Team Lead', icon: '👥' },
];

export default function LeaderForm({ leader, defaultCategory = 'pastor', onSuccess, onCancel }: LeaderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(leader?.image || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [existingLeaders, setExistingLeaders] = useState<Leader[]>([]);

  // Fetch existing leaders for validation
  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const category = leader?.category || defaultCategory;
        const leaders = await getLeadersByCategory(category);
        setExistingLeaders(leaders);
      } catch (error) {
        console.error('Error fetching leaders for validation:', error);
      }
    };
    fetchLeaders();
  }, [leader?.category, defaultCategory]);

  const form = useForm<LeaderFormData>({
    resolver: zodResolver(leaderSchema),
    defaultValues: {
      customId: leader?.customId || undefined,
      name: leader?.name || '',
      role: leader?.role || '',
      bio: leader?.bio || '',
      category: leader?.category || defaultCategory,
      isActive: leader?.isActive ?? true,
    },
  });

  // Custom validation for unique custom ID
  const validateCustomId = (value: string | number | undefined) => {
    if (!value) return true; // Optional field
    
    const customId = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(customId) || customId < 1) {
      return 'Custom ID must be a number greater than 0';
    }
    
    const duplicate = existingLeaders.find(
      l => l.customId === customId && l.id !== leader?.id
    );
    
    if (duplicate) {
      return `Custom ID "${customId}" is already used by ${duplicate.name}`;
    }
    
    return true;
  };

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

  const onSubmit = async (data: LeaderFormData) => {
    if (!imagePreview) {
      toast.error('Please upload a profile image');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = leader?.image || '';

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(
          imageFile,
          'leaders',
          (progress) => setUploadProgress(progress)
        );
      }

      // Convert customId to number if it's a string
      const customId = data.customId ? (typeof data.customId === 'string' ? parseInt(data.customId, 10) : data.customId) : undefined;

      const leaderData = {
        ...data,
        customId,
        image: imageUrl,
        order: leader?.order || 0, // Keep existing order or default to 0
      };

      if (leader?.id) {
        // Update existing leader
        await updateLeader({ ...leader, ...leaderData });
        onSuccess({ ...leader, ...leaderData });
      } else {
        // Create new leader
        const id = await createLeader(leaderData);
        onSuccess({ id, ...leaderData });
      }
    } catch {
      toast.error('Failed to save leader');
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
            {leader ? 'Edit Leader' : 'Add New Leader'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Profile Image</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview} />
                <AvatarFallback>
                  {form.watch('name')?.split(' ').map(n => n[0]).join('') || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
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
                  Upload Image
                </Label>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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

          {/* Custom ID */}
          <div className="space-y-2">
            <Label htmlFor="customId">Ranking ID (Optional)</Label>
            <Input
              id="customId"
              type="number"
              min="1"
              placeholder="e.g., 1 for Lead Pastor, 2 for Associate Pastor"
              {...form.register('customId', { 
                validate: validateCustomId,
                setValueAs: (value) => value === '' ? undefined : parseInt(value, 10)
              })}
            />
            <p className="text-sm text-gray-500">
              Numeric ranking for sorting (1 = highest rank, 2 = second rank, etc.)
            </p>
            {form.formState.errors.customId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.customId.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter leader's full name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              placeholder="e.g., Senior Pastor, Youth Minister"
              {...form.register('role')}
            />
            {form.formState.errors.role && (
              <p className="text-sm text-red-500">
                {form.formState.errors.role.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.watch('category')}
              onValueChange={(value) => form.setValue('category', value as 'pastor' | 'teamLead')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center space-x-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
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

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about this leader..."
              rows={4}
              {...form.register('bio')}
            />
            {form.formState.errors.bio && (
              <p className="text-sm text-red-500">
                {form.formState.errors.bio.message}
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
            <Label htmlFor="isActive">Active (visible on website)</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : leader ? 'Update Leader' : 'Add Leader'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 