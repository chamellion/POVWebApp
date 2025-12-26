/**
 * Shared constants for Gallery module
 * These constants ensure consistency across the admin dashboard
 */

export const GALLERY_CATEGORIES = [
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
] as const;

export const GALLERY_PAGES = [
  { value: 'community-services', label: 'Community Services' },
  { value: 'hero', label: 'Hero Section' },
  { value: 'testimonials', label: 'Testimonials' },
  { value: 'projects', label: 'Projects' },
  { value: 'men-fellowship', label: 'Men Fellowship' },
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'general', label: 'General Gallery' },
] as const;

export type GalleryCategory = typeof GALLERY_CATEGORIES[number];
export type GalleryPageValue = typeof GALLERY_PAGES[number]['value'];

