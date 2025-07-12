'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/storage';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentImageUrl?: string;
  folder?: string;
  className?: string;
}

export function ImageUpload({ 
  onUploadComplete, 
  currentImageUrl, 
  folder = 'general',
  className 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadImage(file, folder, (progress: number) => {
        setProgress(progress);
      });
      
      onUploadComplete(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="image-upload">Image</Label>
        <Input
          id="image-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {previewUrl ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ImageIcon className="h-12 w-12 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload an image
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClick}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Image
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
} 