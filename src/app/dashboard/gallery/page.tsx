'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Image, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryItem, getDocuments, deleteDocument, galleryCollection } from '@/lib/firestore';
import GalleryForm from './GalleryForm';

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

export default function GalleryPage() {
  const { loading } = useProtectedRoute();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getDocuments<GalleryItem>(galleryCollection);
        setGalleryItems(data);
      } catch {
        toast.error('Failed to fetch gallery items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteDocument(galleryCollection, id);
        setGalleryItems(galleryItems.filter(item => item.id !== id));
        toast.success('Image deleted successfully');
      } catch {
        toast.error('Failed to delete image');
      }
    }
  };

  const handleFormSuccess = (item: GalleryItem) => {
    if (editingItem) {
      setGalleryItems(galleryItems.map(i => i.id === item.id ? item : i));
      setEditingItem(null);
    } else {
      setGalleryItems([item, ...galleryItems]);
    }
    setShowForm(false);
    toast.success(editingItem ? 'Image updated successfully' : 'Image added successfully');
  };

  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

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
            <h1 className="text-3xl font-bold text-gray-900">Community Gallery</h1>
            <p className="text-gray-600 mt-2">Manage community photos and memories</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Image className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Photos</p>
                  <p className="text-2xl font-bold text-gray-900">{galleryItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All ({galleryItems.length})
              </Button>
              {categories.map((category) => {
                const count = galleryItems.filter(item => item.category === category).length;
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} ({count})
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Grid */}
        <Card>
          <CardHeader>
            <CardTitle>All Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedCategory === 'all' ? 'No photos yet' : `No photos in ${selectedCategory}`}
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedCategory === 'all' 
                    ? 'Get started by uploading your first community photo.'
                    : `No photos found in the ${selectedCategory} category.`
                  }
                </p>
                {selectedCategory === 'all' && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="relative aspect-square">
                      <img
                        src={item.imageUrl}
                        alt={item.caption}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(item.imageUrl, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900 line-clamp-2">
                          {item.caption}
                        </p>
                        <Badge variant="secondary">{item.category}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <GalleryForm
          item={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </DashboardLayout>
  );
} 