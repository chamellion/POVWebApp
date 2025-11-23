# 🚀 Site Settings Quick Start

## ✅ What's Done

Social media links and contact phone are now **fully connected to the database**!

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 2️⃣ Test Connection

```bash
npm run test-settings
```

### 3️⃣ Add Your Settings

1. Run: `npm run dev`
2. Go to: `http://localhost:3000/dashboard/settings`
3. Fill in contact phone and social media URLs
4. Click "Save All Settings"

## 📱 Client App Usage

```typescript
// Fetch settings
import { getSiteSettings } from '@/lib/firestore';

const settings = await getSiteSettings();
console.log(settings.contactPhone);      // "+44 20 1234 5678"
console.log(settings.socialLinks.facebook); // "https://facebook.com/..."
```

## 📚 Full Documentation

- **Client App API**: `docs/SITE_SETTINGS_API.md`
- **Integration Guide**: `docs/SETTINGS_DATABASE_INTEGRATION.md`
- **Setup Complete**: `docs/SETTINGS_SETUP_COMPLETE.md`

---

**Status**: ✅ Ready to Deploy  
**Next**: Run Step 1 above to deploy Firestore rules

