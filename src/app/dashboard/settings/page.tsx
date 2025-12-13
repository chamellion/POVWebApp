'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { SafeImage } from '@/components/ui/SafeImage';
import { Save, Globe, Phone, MessageSquare, BookOpen, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { 
  SiteSettings, 
  getSiteSettings,
  updateSiteSettings,
  createDefaultSiteSettings
} from '@/lib/firestore';
import { 
  ConfessionOfTheMonth, 
  getConfessionOfTheMonth, 
  updateConfessionOfTheMonth,
  ThemeOfTheMonth,
  getThemeOfTheMonth,
  updateThemeOfTheMonth
} from '@/lib/firestore/content';

export default function SettingsPage() {
  const { loading } = useProtectedRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingConfession, setIsSavingConfession] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  
  const [settings, setSettings] = useState<SiteSettings>({
    homeHeroText: '',
    contactPhone: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
    },
  });

  const [confession, setConfession] = useState<ConfessionOfTheMonth>({
    title: 'Confession of the Month',
    text: '',
    backgroundMode: 'color',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
  });

  const [theme, setTheme] = useState<ThemeOfTheMonth>({
    title: 'Theme of the Month',
    subtitle: '',
    textColor: '#1f2937',
    fontFamily: 'Inter',
  });

  const [showPreview, setShowPreview] = useState(true);
  const [showThemePreview, setShowThemePreview] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Try to get existing settings, create default if none exist
        const existingSettings = await getSiteSettings();
        if (existingSettings) {
          setSettings(existingSettings);
        } else {
          // Create default settings if they don't exist
          await createDefaultSiteSettings();
          const newSettings = await getSiteSettings();
          if (newSettings) {
            setSettings(newSettings);
          }
        }

        // Fetch confession of the month
        const existingConfession = await getConfessionOfTheMonth();
        if (existingConfession) {
          setConfession(existingConfession);
        } else {
          // Set defaults for new confessions
          setConfession({
            title: 'Confession of the Month',
            text: '',
            backgroundMode: 'color',
            backgroundColor: '#f9fafb',
            textColor: '#111827',
            fontFamily: 'Inter',
            fontWeight: 'normal',
            fontStyle: 'normal',
          });
        }

        // Fetch theme of the month
        const existingTheme = await getThemeOfTheMonth();
        if (existingTheme) {
          setTheme(existingTheme);
        } else {
          // Set defaults for new theme
          setTheme({
            title: 'Theme of the Month',
            subtitle: '',
            textColor: '#1f2937',
            fontFamily: 'Inter',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConfession = async () => {
    setIsSavingConfession(true);
    try {
      await updateConfessionOfTheMonth(confession);
      toast.success('Confession of the Month saved successfully');
    } catch (error) {
      console.error('Error saving confession:', error);
      toast.error('Failed to save confession');
    } finally {
      setIsSavingConfession(false);
    }
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    try {
      await updateThemeOfTheMonth(theme);
      toast.success('Theme of the Month saved successfully');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleResetTheme = () => {
    setTheme({
      title: 'Theme of the Month',
      subtitle: '',
      textColor: '#1f2937',
      fontFamily: 'Inter',
    });
    toast.success('Theme reset to defaults');
  };

  const updateSocialLink = (platform: keyof SiteSettings['socialLinks'], value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
            <p className="text-gray-600 mt-2">Manage your website configuration</p>
          </div>
        </div>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Content Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroText">Home Hero Text</Label>
              <Textarea
                id="heroText"
                placeholder="Enter the main hero text for your homepage..."
                rows={3}
                value={settings.homeHeroText}
                onChange={(e) => setSettings(prev => ({ ...prev, homeHeroText: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Confession of the Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Confession of the Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confessionTitle">Title</Label>
              <Input
                id="confessionTitle"
                placeholder="Confession of the Month"
                value={confession.title}
                onChange={(e) => setConfession(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confessionText">Text</Label>
              <Textarea
                id="confessionText"
                placeholder="Enter the confession text..."
                rows={6}
                value={confession.text}
                onChange={(e) => setConfession(prev => ({ ...prev, text: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundMode">Background Mode</Label>
              <Select
                value={confession.backgroundMode}
                onValueChange={(value: 'image' | 'color') => 
                  setConfession(prev => ({ ...prev, backgroundMode: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {confession.backgroundMode === 'image' && (
              <div className="space-y-2">
                <Label>Background Image</Label>
                <ImageUpload
                  onUploadComplete={(url) => setConfession(prev => ({ ...prev, backgroundImageUrl: url }))}
                  folder="confession-backgrounds"
                />
                <div className="text-sm text-gray-500">
                  Or enter a URL directly:
                </div>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={confession.backgroundImageUrl || ''}
                  onChange={(e) => setConfession(prev => ({ ...prev, backgroundImageUrl: e.target.value }))}
                />
              </div>
            )}

            {confession.backgroundMode === 'color' && (
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={confession.backgroundColor}
                    onChange={(e) => setConfession(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={confession.backgroundColor}
                    onChange={(e) => setConfession(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#f9fafb"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="textColor"
                  type="color"
                  value={confession.textColor}
                  onChange={(e) => setConfession(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={confession.textColor}
                  onChange={(e) => setConfession(prev => ({ ...prev, textColor: e.target.value }))}
                  placeholder="#111827"
                />
              </div>
            </div>

            {/* Font Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={confession.fontFamily}
                  onValueChange={(value) => setConfession(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Lora">Lora</SelectItem>
                    <SelectItem value="Merriweather">Merriweather</SelectItem>
                    <SelectItem value="Roboto Slab">Roboto Slab</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                    <SelectItem value="Montserrat">Montserrat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontWeight">Font Weight</Label>
                <Select
                  value={confession.fontWeight}
                  onValueChange={(value) => setConfession(prev => ({ ...prev, fontWeight: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="800">Extra Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontStyle">Font Style</Label>
                <Select
                  value={confession.fontStyle}
                  onValueChange={(value) => setConfession(prev => ({ ...prev, fontStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showPreview"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="showPreview" className="text-sm font-medium">
                  Show Preview
                </Label>
              </div>
              
              <Button 
                onClick={handleSaveConfession} 
                disabled={isSavingConfession} 
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingConfession ? 'Saving...' : 'Save Confession'}
              </Button>
            </div>

            {/* Live Preview */}
            {showPreview && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Live Preview
                </Label>
                <div 
                  className="relative rounded-lg overflow-hidden shadow-lg"
                  style={{
                    backgroundColor: confession.backgroundMode === 'image' ? 'transparent' : confession.backgroundColor,
                    backgroundImage: confession.backgroundMode === 'image' && confession.backgroundImageUrl
                      ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${confession.backgroundImageUrl})`
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '200px',
                  }}
                >
                  <div className="p-6 text-center">
                    <h2 
                      className="text-2xl md:text-4xl font-bold mb-4 leading-tight"
                      style={{
                        color: confession.textColor,
                        fontFamily: confession.fontFamily,
                        fontWeight: confession.fontWeight,
                        fontStyle: confession.fontStyle,
                      }}
                    >
                      {confession.title || 'Your confession will appear here...'}
                    </h2>
                    <p 
                      className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
                      style={{
                        color: confession.textColor,
                        fontFamily: confession.fontFamily,
                        fontWeight: confession.fontWeight,
                        fontStyle: confession.fontStyle,
                      }}
                    >
                      {confession.text || 'Your confession text will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme of the Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Theme of the Month</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="themeTitle">Title *</Label>
              <Input
                id="themeTitle"
                placeholder="Theme of the Month"
                value={theme.title}
                onChange={(e) => setTheme(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="themeSubtitle">Subtitle (Optional)</Label>
              <Input
                id="themeSubtitle"
                placeholder="Enter subtitle..."
                value={theme.subtitle || ''}
                onChange={(e) => setTheme(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Supporting Image (Optional)</Label>
              <ImageUpload
                onUploadComplete={(url) => setTheme(prev => ({ ...prev, imageUrl: url }))}
                folder="theme-images"
              />
            </div>

            {/* Font Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="themeFontFamily">Font Family</Label>
                <Select
                  value={theme.fontFamily}
                  onValueChange={(value) => setTheme(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter">Inter (Sans)</SelectItem>
                    <SelectItem value="Lora">Lora (Serif)</SelectItem>
                    <SelectItem value="Merriweather">Merriweather (Serif)</SelectItem>
                    <SelectItem value="Roboto Slab">Roboto Slab (Display)</SelectItem>
                    <SelectItem value="Playfair Display">Playfair Display (Display)</SelectItem>
                    <SelectItem value="Montserrat">Montserrat (Sans)</SelectItem>
                    <SelectItem value="Dancing Script">Dancing Script (Handwriting)</SelectItem>
                    <SelectItem value="Pacifico">Pacifico (Handwriting)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeTextColor">Text Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="themeTextColor"
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => setTheme(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={theme.textColor}
                    onChange={(e) => setTheme(prev => ({ ...prev, textColor: e.target.value }))}
                    placeholder="#1f2937"
                  />
                </div>
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showThemePreview"
                  checked={showThemePreview}
                  onChange={(e) => setShowThemePreview(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="showThemePreview" className="text-sm font-medium">
                  Show Preview
                </Label>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleResetTheme} 
                  variant="outline"
                  size="sm"
                >
                  Reset
                </Button>
                <Button 
                  onClick={handleSaveTheme} 
                  disabled={isSavingTheme} 
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingTheme ? 'Saving...' : 'Save Theme'}
                </Button>
              </div>
            </div>

            {/* Live Preview */}
            {showThemePreview && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Live Preview
                </Label>
                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <div className="text-center">
                    <h2 
                      className="text-3xl md:text-4xl font-bold mb-2 leading-tight"
                      style={{
                        color: theme.textColor,
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      {theme.title || 'Your theme title will appear here...'}
                    </h2>
                    {theme.subtitle && (
                      <p 
                        className="text-lg md:text-xl leading-relaxed max-w-3xl mx-auto"
                        style={{
                          color: theme.textColor,
                          fontFamily: theme.fontFamily,
                        }}
                      >
                        {theme.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {theme.imageUrl && (
                    <div className="mt-6">
                      <SafeImage
                        src={theme.imageUrl}
                        alt="Theme supporting image"
                        width={800}
                        height={400}
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={settings.contactPhone}
                onChange={(e) => setSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Social Media Links</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook URL</Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/yourchurch"
                  value={settings.socialLinks.facebook || ''}
                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram URL</Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/yourchurch"
                  value={settings.socialLinks.instagram || ''}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter URL</Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/yourchurch"
                  value={settings.socialLinks.twitter || ''}
                  onChange={(e) => updateSocialLink('twitter', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/yourchurch"
                  value={settings.socialLinks.youtube || ''}
                  onChange={(e) => updateSocialLink('youtube', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
} 