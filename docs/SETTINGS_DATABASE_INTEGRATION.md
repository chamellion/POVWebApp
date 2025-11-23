# Site Settings Database Integration - Summary

## Overview

The site settings (social media links and contact phone number) have been fully integrated with Firebase Firestore. The client app can now fetch real-time settings data from the database instead of using hardcoded values.

## What Was Done

### 1. Database Schema ✅

**Collection**: `settings`  
**Document ID**: `main`  
**Fields**:
- `contactPhone` (string) - Church contact phone number
- `homeHeroText` (string) - Main homepage hero text
- `socialLinks` (object):
  - `facebook` (string) - Facebook page URL
  - `instagram` (string) - Instagram profile URL
  - `twitter` (string) - Twitter profile URL
  - `youtube` (string) - YouTube channel URL
- `updatedAt` (timestamp) - Last update timestamp

### 2. Helper Functions Added ✅

Added to `/src/lib/firestore.ts`:

```typescript
// Fetch site settings
getSiteSettings(): Promise<SiteSettings | null>

// Update site settings (admin only)
updateSiteSettings(settings: Partial<SiteSettings>): Promise<void>

// Create default settings if none exist
createDefaultSiteSettings(): Promise<void>

// Real-time listener for settings changes
subscribeToSiteSettings(callback: (data: SiteSettings | null) => void)
```

### 3. Firestore Security Rules Updated ✅

**Before**:
```javascript
match /settings/{document} {
  allow read, write: if request.auth != null; // Only admins could read
}
```

**After**:
```javascript
match /settings/{document} {
  allow read: if true; // ✅ Public read access for client app
  allow write: if request.auth != null; // Only authenticated admins can write
}
```

This allows the client app to fetch settings without authentication, while keeping write access restricted to authenticated administrators.

### 4. Settings Page Updated ✅

Updated `/src/app/dashboard/settings/page.tsx` to:
- Use the new helper functions (`getSiteSettings`, `updateSiteSettings`)
- Automatically create default settings if they don't exist
- Better error handling
- Cleaner code structure

### 5. Documentation Created ✅

Created comprehensive documentation:
- **SITE_SETTINGS_API.md** - Full API documentation with examples for client app developers
- **SETTINGS_DATABASE_INTEGRATION.md** - This summary document
- **test-settings.js** - Test script to verify database connectivity

## How It Works

### Admin Dashboard Flow

1. **Admin logs in** to the dashboard
2. **Navigates to Settings** (`/dashboard/settings`)
3. **Updates fields**:
   - Contact phone number
   - Facebook, Instagram, Twitter, YouTube URLs
   - Home hero text
4. **Clicks "Save All Settings"**
5. **Data is saved** to Firestore `settings/main` document
6. **Client app immediately sees** the updated values (if using real-time subscription)

### Client App Flow

1. **On page load**, fetch settings from Firestore
2. **Display** social media links and contact information
3. **Optional**: Subscribe to real-time updates
4. **No authentication** required for reading

## Example Client App Usage

### Simple Fetch (One-time)

```typescript
import { getSiteSettings } from '@/lib/firestore';

async function loadSettings() {
  const settings = await getSiteSettings();
  
  console.log('Contact Phone:', settings.contactPhone);
  console.log('Social Links:', settings.socialLinks);
}
```

### Real-time Subscription (Recommended)

```typescript
import { subscribeToSiteSettings } from '@/lib/firestore';

function MyComponent() {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    const unsubscribe = subscribeToSiteSettings((data) => {
      setSettings(data);
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <div>
      <a href={`tel:${settings?.contactPhone}`}>
        {settings?.contactPhone}
      </a>
      
      {settings?.socialLinks.facebook && (
        <a href={settings.socialLinks.facebook}>Facebook</a>
      )}
      {/* ... other social links */}
    </div>
  );
}
```

## Testing the Integration

### Method 1: Using the Test Script

```bash
# Run the test script
node scripts/test-settings.js
```

This will:
- Verify Firebase connection
- Check if settings exist
- Create default settings if needed
- Display current settings

### Method 2: Manual Testing

1. **Start the dashboard**:
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**:
   - Go to `http://localhost:3000/dashboard/settings`
   - Log in if needed

3. **Update Settings**:
   - Add a contact phone number: `+44 20 1234 5678`
   - Add social media URLs:
     - Facebook: `https://facebook.com/rccg-pov`
     - Instagram: `https://instagram.com/rccg_pov`
     - Twitter: `https://twitter.com/rccg_pov`
     - YouTube: `https://youtube.com/@rccg-pov`
   - Click "Save All Settings"

4. **Verify in Firestore Console**:
   - Open Firebase Console
   - Navigate to Firestore Database
   - Look for `settings` collection → `main` document
   - Verify all fields are saved correctly

### Method 3: Browser Console Testing

```javascript
// In the client app, open browser console
import { getSiteSettings } from '@/lib/firestore';

getSiteSettings().then(settings => {
  console.log('Settings:', settings);
});
```

## Benefits

### For Administrators
✅ Easy to update social media links and contact info through the dashboard  
✅ No code changes needed to update settings  
✅ Changes reflect immediately on the client app  
✅ Audit trail with `updatedAt` timestamp  

### For Developers
✅ Simple API with helper functions  
✅ TypeScript support with proper types  
✅ Real-time updates with subscription  
✅ No authentication required for reading  
✅ Comprehensive documentation  

### For End Users
✅ Always see up-to-date contact information  
✅ Correct social media links  
✅ No website downtime for content updates  

## Security Considerations

- ✅ **Public Read Access**: Safe because settings contain only public information (phone, social links)
- ✅ **Authenticated Write Access**: Only logged-in administrators can modify settings
- ✅ **Validated Data**: TypeScript ensures data integrity
- ✅ **Firestore Rules**: Enforced at the database level

## Deployment Checklist

Before deploying to production:

- [ ] Deploy updated Firestore rules:
  ```bash
  firebase deploy --only firestore:rules
  ```

- [ ] Verify settings document exists:
  ```bash
  node scripts/test-settings.js
  ```

- [ ] Test settings page in production:
  - Update settings
  - Verify they save correctly
  - Check Firestore console

- [ ] Test client app:
  - Verify settings load correctly
  - Check social media links work
  - Verify contact phone displays

## Troubleshooting

### Settings Not Loading in Client App

**Issue**: Settings return `null` or empty  
**Solution**:
1. Check Firestore rules are deployed
2. Verify settings document exists: `node scripts/test-settings.js`
3. Check browser console for errors
4. Verify Firebase initialization in client app

### Can't Save Settings in Dashboard

**Issue**: "Failed to save settings" error  
**Solution**:
1. Verify user is authenticated
2. Check Firestore rules allow write for authenticated users
3. Check browser console for detailed error
4. Verify Firebase connection

### Settings Not Updating in Real-time

**Issue**: Changes don't reflect immediately  
**Solution**:
1. Use `subscribeToSiteSettings()` instead of one-time fetch
2. Verify subscription is properly set up
3. Check for memory leaks (call unsubscribe on unmount)

## Future Enhancements

Potential improvements to consider:

1. **Additional Settings**:
   - Email address
   - Physical address
   - WhatsApp number
   - TikTok, LinkedIn links

2. **Validation**:
   - Phone number format validation
   - URL format validation
   - Required field validation

3. **Versioning**:
   - Track settings history
   - Ability to revert changes

4. **Caching**:
   - Client-side caching strategy
   - Reduce database reads

5. **Localization**:
   - Multi-language support
   - Region-specific phone numbers

## Support

For questions or issues with the settings integration:
- Review the **SITE_SETTINGS_API.md** documentation
- Run the test script: `node scripts/test-settings.js`
- Check Firebase Console for Firestore data
- Review browser console for errors

---

**Last Updated**: November 2025  
**Status**: ✅ Fully Implemented and Tested

