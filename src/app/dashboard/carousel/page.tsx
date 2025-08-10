'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  CarouselSlide, 
  addCarouselSlide, 
  updateCarouselSlide, 
  deleteCarouselSlide,
  reorderCarouselSlides,
  subscribeToCarouselSlides
} from '@/lib/firestore/content';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown,
  GripVertical 
} from 'lucide-react';

const carouselSchema = z.object({
  headline: z.string().min(1, 'Headline is required'),
  subheadline: z.string().min(1, 'Subheadline is required'),
  ctaText: z.string().optional(),
  ctaLink: z.string().url().optional().or(z.literal('')),
  isVisible: z.boolean(),
});

type CarouselFormData = z.infer<typeof carouselSchema>;

// Draggable Slide Component
function DraggableSlide({ 
  slide, 
  index, 
  totalSlides,
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  onMove 
}: {
  slide: CarouselSlide;
  index: number;
  totalSlides: number;
  onEdit: (slide: CarouselSlide) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (slide: CarouselSlide) => void;
  onMove: (slide: CarouselSlide, direction: 'up' | 'down') => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Slide {index + 1}</CardTitle>
            <Badge variant={slide.isVisible ? 'default' : 'secondary'}>
              {slide.isVisible ? 'Visible' : 'Hidden'}
            </Badge>
            <Badge variant="outline">Order: {slide.order}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(slide)}
            >
              {slide.isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(slide)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(slide.id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Image
              src={slide.imageUrl}
              alt={slide.headline}
              width={400}
              height={128}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <div>
              <h3 className="font-semibold">{slide.headline}</h3>
              <p className="text-sm text-muted-foreground">{slide.subheadline}</p>
            </div>
            {slide.ctaText && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{slide.ctaText}</Badge>
                {slide.ctaLink && (
                  <span className="text-xs text-muted-foreground">
                    → {slide.ctaLink}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMove(slide, 'up')}
                disabled={index === 0}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMove(slide, 'down')}
                disabled={index === totalSlides - 1}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CarouselPage() {
  const { loading: authLoading } = useProtectedRoute();
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CarouselFormData>({
    resolver: zodResolver(carouselSchema),
    defaultValues: {
      isVisible: true,
    },
  });

  const isVisible = watch('isVisible');

  useEffect(() => {
    if (!authLoading) {
      // Set up real-time listener for carousel slides
      const unsubscribe = subscribeToCarouselSlides((data) => {
        setSlides(data);
        setLoading(false);
      }, true); // Include hidden slides for admin view

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }
  }, [authLoading]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = slides.findIndex(slide => slide.id === active.id);
      const newIndex = slides.findIndex(slide => slide.id === over?.id);

      const newSlides = arrayMove(slides, oldIndex, newIndex);
      
      // Update local state immediately for smooth UI
      setSlides(newSlides);
      
      // Update orders and persist to Firestore
      const updatedSlides = newSlides.map((slide, index) => ({ ...slide, order: index }));
      
      try {
        await reorderCarouselSlides(updatedSlides.map(s => ({ id: s.id!, order: s.order })));
        toast.success('Slides reordered successfully');
      } catch (error) {
        toast.error('Failed to reorder slides');
        console.error('Error reordering slides:', error);
        // Revert local state on error
        setSlides(slides);
      }
    }
  };

  const onSubmit = async (data: CarouselFormData) => {
    if (!uploadedImageUrl && !editingSlide?.imageUrl) {
      toast.error('Please upload an image');
      return;
    }

    try {
      const slideData = {
        ...data,
        imageUrl: uploadedImageUrl || editingSlide?.imageUrl || '',
        order: editingSlide ? editingSlide.order : slides.length,
      };

      if (editingSlide) {
        await updateCarouselSlide(editingSlide.id!, slideData);
        toast.success('Slide updated successfully');
      } else {
        await addCarouselSlide(slideData);
        toast.success('Slide added successfully');
      }

      reset();
      setUploadedImageUrl('');
      setEditingSlide(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save slide');
      console.error('Error saving slide:', error);
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setValue('headline', slide.headline);
    setValue('subheadline', slide.subheadline);
    setValue('ctaText', slide.ctaText || '');
    setValue('ctaLink', slide.ctaLink || '');
    setValue('isVisible', slide.isVisible);
    setUploadedImageUrl('');
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      await deleteCarouselSlide(id);
      toast.success('Slide deleted successfully');
    } catch (error) {
      toast.error('Failed to delete slide');
      console.error('Error deleting slide:', error);
    }
  };

  const handleToggleVisibility = async (slide: CarouselSlide) => {
    try {
      await updateCarouselSlide(slide.id!, { isVisible: !slide.isVisible });
      toast.success(`Slide ${slide.isVisible ? 'hidden' : 'shown'} successfully`);
    } catch (error) {
      toast.error('Failed to update slide visibility');
      console.error('Error updating slide:', error);
    }
  };

  const handleMove = async (slide: CarouselSlide, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === slide.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === slides.length - 1)
    ) {
      return;
    }

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap orders
    [newSlides[currentIndex], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[currentIndex]];
    
    // Update orders
    const updatedSlides = newSlides.map((s, index) => ({ ...s, order: index }));
    
    try {
      await reorderCarouselSlides(updatedSlides.map(s => ({ id: s.id!, order: s.order })));
      toast.success('Slides reordered successfully');
    } catch (error) {
      toast.error('Failed to reorder slides');
      console.error('Error reordering slides:', error);
    }
  };

  const openNewSlideDialog = () => {
    setEditingSlide(null);
    reset();
    setUploadedImageUrl('');
    setIsDialogOpen(true);
  };

  if (authLoading || loading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Carousel</h1>
            <p className="text-gray-600 mt-2">
              Manage homepage carousel slides and their content. Drag slides to reorder them.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewSlideDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSlide ? 'Edit Slide' : 'Add New Slide'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <ImageUpload
                    onUploadComplete={setUploadedImageUrl}
                    currentImageUrl={editingSlide?.imageUrl}
                    folder="carousel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    {...register('headline')}
                    placeholder="Enter headline"
                  />
                  {errors.headline && (
                    <p className="text-sm text-red-500">{errors.headline.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subheadline">Subheadline</Label>
                  <Textarea
                    id="subheadline"
                    {...register('subheadline')}
                    placeholder="Enter subheadline"
                    rows={3}
                  />
                  {errors.subheadline && (
                    <p className="text-sm text-red-500">{errors.subheadline.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ctaText">CTA Text (Optional)</Label>
                    <Input
                      id="ctaText"
                      {...register('ctaText')}
                      placeholder="e.g., Learn More"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ctaLink">CTA Link (Optional)</Label>
                    <Input
                      id="ctaLink"
                      {...register('ctaLink')}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVisible"
                    checked={isVisible}
                    onCheckedChange={(checked: boolean) => setValue('isVisible', checked)}
                  />
                  <Label htmlFor="isVisible">Visible on homepage</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : editingSlide ? 'Update Slide' : 'Add Slide'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slides.map(slide => slide.id!)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4">
              {slides.map((slide, index) => (
                <DraggableSlide
                  key={slide.id}
                  slide={slide}
                  index={index}
                  totalSlides={slides.length}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  onMove={handleMove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {slides.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No carousel slides yet</p>
              <Button onClick={openNewSlideDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Slide
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 