'use client';

import { useState, useEffect } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Globe, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { 
  SiteSettings, 
  getDocument, 
  updateDocument, 
  settingsCollection
} from '@/lib/firestore';

export default function SettingsPage() {
  const { loading } = useProtectedRoute();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Try to get existing settings, create default if none exist
        const existingSettings = await getDocument<SiteSettings>(settingsCollection, 'main');
        if (existingSettings) {
          setSettings(existingSettings);
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
      await updateDocument(settingsCollection, 'main', settings);
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
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