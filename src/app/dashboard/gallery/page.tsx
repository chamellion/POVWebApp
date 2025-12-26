'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Image as ImageIcon, Eye, Sparkles, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { GalleryItem, getDocuments, deleteDocument, galleryCollection } from '@/lib/firestore';
import { deleteImage } from '@/lib/storage';
import GalleryForm from './GalleryForm';
import { GALLERY_CATEGORIES, GALLERY_PAGES } from '@/lib/constants/gallery';

export default function GalleryPage() {
  const { loading } = useProtectedRoute();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPage, setSelectedPage] = useState<string>('all');

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

  const handleDelete = async (id: string, url: string) => {
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      try {
        // Delete from Storage first
        await deleteImage(url);
        
        // Then delete from Firestore
        await deleteDocument(galleryCollection, id);
        
        // Update local state
        setGalleryItems(galleryItems.filter(item => item.id !== id));
        toast.success('Image deleted successfully');
      } catch (error) {
        console.error('Delete error:', error);
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

  const filteredItems = galleryItems.filter(item => {
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const pageMatch = selectedPage === 'all' || item.page === selectedPage;
    return categoryMatch && pageMatch;
  });

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
      <div className="space-y-8 pb-8">
        {/* Header with Gradient Background */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                <h1 className="text-4xl font-bold text-white">Community Gallery</h1>
              </div>
              <p className="text-blue-100 text-lg">Manage your community photos and memories with style</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <ImageIcon className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">{galleryItems.length} Photos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                  <Filter className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">{filteredItems.length} Filtered</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Photo
            </Button>
          </div>
        </div>

        {/* Filters with Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Filter */}
          <Card className="border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Filter className="h-5 w-5" />
                Filter by Page/Section
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedPage === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPage('all')}
                  className={selectedPage === 'all' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:border-purple-300 hover:text-purple-700'}
                >
                  All ({galleryItems.length})
                </Button>
                {GALLERY_PAGES.map((page) => {
                  const count = galleryItems.filter(item => item.page === page.value).length;
                  return (
                    <Button
                      key={page.value}
                      variant={selectedPage === page.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPage(page.value)}
                      className={selectedPage === page.value ? 'bg-purple-600 hover:bg-purple-700' : 'hover:border-purple-300 hover:text-purple-700'}
                    >
                      {page.label} ({count})
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <ImageIcon className="h-5 w-5" />
                Filter by Category
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:border-blue-300 hover:text-blue-700'}
                >
                  All ({galleryItems.length})
                </Button>
                {GALLERY_CATEGORIES.map((category) => {
                  const count = galleryItems.filter(item => item.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? 'bg-blue-600 hover:bg-blue-700' : 'hover:border-blue-300 hover:text-blue-700'}
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Grid with Beautiful Cards */}
        {filteredItems.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                  <ImageIcon className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {selectedCategory === 'all' && selectedPage === 'all' ? 'No photos yet' : 'No matching photos'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {selectedCategory === 'all' && selectedPage === 'all'
                    ? 'Get started by uploading your first community photo and build your beautiful gallery.'
                    : 'Try adjusting your filters to see more photos.'
                  }
                </p>
                {selectedCategory === 'all' && selectedPage === 'all' && (
                  <Button 
                    onClick={() => setShowForm(true)}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Upload Your First Photo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="group relative"
                style={{
                  animation: `fadeIn 0.5s ease-out ${index * 0.05}s both`
                }}
              >
                <Card className="overflow-hidden h-full flex flex-col border-2 border-transparent hover:border-purple-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <Image
                      src={item.url}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                    {/* Overlay with Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
                      <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                          className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="bg-blue-500/90 hover:bg-blue-600 text-white backdrop-blur-sm shadow-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id!, item.url)}
                          className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-base leading-tight group-hover:text-purple-700 transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-auto pt-2 flex flex-wrap gap-2">
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-0 shadow-sm"
                        >
                          {item.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 border-purple-200 shadow-sm"
                        >
                          {GALLERY_PAGES.find(p => p.value === item.page)?.label || item.page}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
        
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
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