'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GalleryItem, getDocuments, galleryCollection } from '@/lib/firestore';
import { Heart, Users, Gift, Brain, Star, Hammer, Utensils, ShoppingBag, Package, Trophy } from 'lucide-react';

const categories = [
  'Food & Clothing',
  'Outreach',
  'Youth',
  'Mental Health',
  'Festive Support',
  'Hero',
  'Projects',
  'Samaritan Basket',
  'Christmas Hamper Initiative',
  'Men Football/Get Together'
];

const categoryIcons = {
  'Food & Clothing': Utensils,
  'Outreach': Heart,
  'Youth': Users,
  'Mental Health': Brain,
  'Festive Support': Gift,
  'Hero': Star,
  'Projects': Hammer,
  'Samaritan Basket': ShoppingBag,
  'Christmas Hamper Initiative': Package,
  'Men Football/Get Together': Trophy,
};

export default function CommunityServicesPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await getDocuments<GalleryItem>(galleryCollection);
        setGalleryItems(data);
      } catch (error) {
        console.error('Error fetching gallery items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const filteredItems = selectedCategory === 'all' 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const getCategoryCount = (category: string) => {
    return galleryItems.filter(item => item.category === category).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Community Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Making a difference in our community through love, service, and outreach
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our Services
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCategory('all')}
              className="text-lg px-6 py-3"
            >
              All Services ({galleryItems.length})
            </Button>
            {categories.map((category) => {
              const count = getCategoryCount(category);
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setSelectedCategory(category)}
                  className="text-lg px-6 py-3"
                >
                  {Icon && <Icon className="h-5 w-5 mr-2" />}
                  {category} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Heart className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {selectedCategory === 'all' ? 'No services available' : `No services in ${selectedCategory}`}
            </h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'Check back soon for updates on our community services.'
                : `No services found in the ${selectedCategory} category.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              const Icon = categoryIcons[item.category as keyof typeof categoryIcons];
              return (
                <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="relative aspect-video">
                    <Image
                      src={item.url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/90 text-gray-900">
                        {Icon && <Icon className="h-3 w-3 mr-1" />}
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-sm">
                        {item.category}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get Involved
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Join us in making a difference in our community. There are many ways to get involved and help those in need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-3">
                  Volunteer With Us
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  Donate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
