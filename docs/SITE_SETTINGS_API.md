# Site Settings API Documentation

This document explains how to fetch and use site settings (social media links and contact information) from the database in your client application.

## Overview

The site settings are stored in Firestore under the `settings` collection with a document ID of `main`. These settings include:
- **Contact Phone**: Church contact phone number
- **Social Media Links**: Facebook, Instagram, Twitter, YouTube URLs
- **Home Hero Text**: Main text for the homepage hero section

## Database Structure

**Collection**: `settings`  
**Document ID**: `main`

**Data Structure**:
```typescript
{
  contactPhone: string;           // e.g., "+44 20 1234 5678"
  homeHeroText: string;           // e.g., "Welcome to RCCG Place of Victory"
  socialLinks: {
    facebook?: string;            // e.g., "https://facebook.com/rccg-pov"
    instagram?: string;           // e.g., "https://instagram.com/rccg_pov"
    twitter?: string;             // e.g., "https://twitter.com/rccg_pov"
    youtube?: string;             // e.g., "https://youtube.com/@rccg-pov"
  };
  updatedAt?: Timestamp;
}
```

## Firestore Security Rules

The settings collection has **public read access** and **authenticated write access**:

```javascript
match /settings/{document} {
  allow read: if true; // Anyone can read
  allow write: if request.auth != null; // Only authenticated admins can write
}
```

## Fetching Settings in Client App

### Option 1: Using the Helper Function (Recommended)

The dashboard provides a helper function `getSiteSettings()` that you can use:

```typescript
import { getSiteSettings } from '@/lib/firestore';

// Fetch settings once
async function fetchSettings() {
  try {
    const settings = await getSiteSettings();
    if (settings) {
      console.log('Contact Phone:', settings.contactPhone);
      console.log('Facebook URL:', settings.socialLinks.facebook);
      console.log('Instagram URL:', settings.socialLinks.instagram);
      console.log('Twitter URL:', settings.socialLinks.twitter);
      console.log('YouTube URL:', settings.socialLinks.youtube);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  }
}
```

### Option 2: Real-time Updates with Subscription

For real-time updates when settings change:

```typescript
import { subscribeToSiteSettings } from '@/lib/firestore';

// Subscribe to settings changes
function useSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    const unsubscribe = subscribeToSiteSettings((data) => {
      setSettings(data);
    });
    
    return () => unsubscribe();
  }, []);
  
  return settings;
}
```

### Option 3: Direct Firestore Query

If you prefer to query Firestore directly:

```typescript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

async function fetchSettingsDirectly() {
  const settingsRef = doc(db, 'settings', 'main');
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists()) {
    const data = settingsSnap.data();
    return {
      contactPhone: data.contactPhone,
      socialLinks: data.socialLinks,
      homeHeroText: data.homeHeroText,
    };
  }
  
  return null;
}
```

## Example Usage in React Component

### Display Social Media Links

```typescript
import { getSiteSettings } from '@/lib/firestore';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function SocialMediaLinks() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings();
      setSettings(data);
    }
    loadSettings();
  }, []);
  
  if (!settings) return null;
  
  return (
    <div className="flex gap-4">
      {settings.socialLinks.facebook && (
        <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
          <Facebook className="h-6 w-6" />
        </a>
      )}
      {settings.socialLinks.instagram && (
        <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
          <Instagram className="h-6 w-6" />
        </a>
      )}
      {settings.socialLinks.twitter && (
        <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
          <Twitter className="h-6 w-6" />
        </a>
      )}
      {settings.socialLinks.youtube && (
        <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
          <Youtube className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
```

### Display Contact Information

```typescript
import { getSiteSettings } from '@/lib/firestore';
import { Phone } from 'lucide-react';

export default function ContactInfo() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    async function loadSettings() {
      const data = await getSiteSettings();
      setSettings(data);
    }
    loadSettings();
  }, []);
  
  if (!settings || !settings.contactPhone) return null;
  
  return (
    <div className="flex items-center gap-2">
      <Phone className="h-5 w-5" />
      <a href={`tel:${settings.contactPhone}`} className="hover:underline">
        {settings.contactPhone}
      </a>
    </div>
  );
}
```

## Updating Settings (Admin Only)

Settings can only be updated through the dashboard by authenticated administrators:

1. Log in to the admin dashboard
2. Navigate to **Settings** page
3. Update the desired fields:
   - Contact Phone
   - Social Media Links
   - Home Hero Text
4. Click **Save All Settings**

The changes will be immediately available to the client app.

## Best Practices

1. **Cache Settings**: Consider caching settings in your app state to avoid repeated database queries
2. **Fallback Values**: Always have fallback values in case settings aren't loaded yet
3. **Validate URLs**: Check that social media URLs are valid before displaying links
4. **Loading States**: Show loading indicators while fetching settings
5. **Error Handling**: Gracefully handle errors if settings can't be fetched

## Example with Caching

```typescript
// Create a context to share settings across your app
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSiteSettings, subscribeToSiteSettings, SiteSettings } from '@/lib/firestore';

const SettingsContext = createContext<SiteSettings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSiteSettings((data) => {
      setSettings(data);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings anywhere in your app
export function useSettings() {
  return useContext(SettingsContext);
}
```

Then use it in your components:

```typescript
function Footer() {
  const settings = useSettings();
  
  return (
    <footer>
      {settings?.contactPhone && (
        <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a>
      )}
      {/* Social media links */}
    </footer>
  );
}
```

## Testing

You can test the settings API using the browser console:

```javascript
// In browser console
import { getSiteSettings } from './lib/firestore';

getSiteSettings().then(settings => {
  console.log('Current settings:', settings);
});
```

## Support

For any issues or questions about the settings API, please contact the development team.

