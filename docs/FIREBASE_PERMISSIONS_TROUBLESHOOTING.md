# Firebase Permissions Troubleshooting Guide

## Overview
This guide helps resolve "Missing or insufficient permissions" errors in the church dashboard application.

## Common Causes & Solutions

### 1. **Firestore Rules Missing Collections**
**Problem**: The application tries to access collections that aren't defined in `firestore.rules`

**Solution**: Updated `firestore.rules` to include all required collections:
```javascript
// Added missing collections:
match /leaders/{document} {
  allow read, write: if request.auth != null;
}

match /mission_vision/{document} {
  allow read, write: if request.auth != null;
}

match /service_times/{document} {
  allow read, write: if request.auth != null;
}

match /about/{document} {
  allow read, write: if request.auth != null;
}

match /community_service/{document} {
  allow read, write: if request.auth != null;
}
```

### 2. **Authentication State Issues**
**Problem**: User appears logged in but Firebase doesn't recognize the authentication

**Check**:
- Browser console for authentication logs
- Firebase Auth state in browser dev tools
- User object in React state

**Solution**: Ensure proper authentication flow:
```typescript
// Check if user is properly authenticated
const { user, loading } = useAuth();

if (loading) {
  return <div>Loading...</div>;
}

if (!user) {
  return <div>Please log in</div>;
}
```

### 3. **Firestore Rules Deployment**
**Problem**: Updated rules not deployed to Firebase

**Solution**: Deploy updated rules:
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Or deploy everything
firebase deploy
```

### 4. **Collection Name Mismatches**
**Problem**: Code uses different collection names than defined in rules

**Check**: Verify collection names match exactly:
```typescript
// In firestore.ts
export const testimoniesCollection = 'testimonies';
export const testimoniesExportsCollection = 'testimonies_exports';

// In firestore.rules
match /testimonies/{document} {
  allow read, write: if request.auth != null;
}
```

## Debugging Steps

### Step 1: Check Browser Console
Look for these logs:
```
🔐 AuthProvider: Initializing auth state listener...
👤 AuthProvider: Auth state changed: User logged in
```

### Step 2: Verify Authentication State
```typescript
// Add this to your component for debugging
const { user, loading } = useAuth();
console.log('Auth state:', { user: !!user, loading, uid: user?.uid });
```

### Step 3: Check Firestore Rules Status
```bash
# Check current rules
firebase firestore:rules:get

# Deploy updated rules
firebase deploy --only firestore:rules
```

### Step 4: Test Specific Collections
Try accessing collections individually to identify which one is causing issues:
```typescript
// Test testimonies collection
const testimoniesRef = collection(db, 'testimonies');
const testimoniesSnapshot = await getDocs(testimoniesRef);
console.log('Testimonies count:', testimoniesSnapshot.size);
```

## Updated Firestore Rules

The complete `firestore.rules` now includes all collections:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // CLIENT-FACING COLLECTIONS
    match /events/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /recurringEvents/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /skippedRecurringEvents/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /pastors/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /carousel/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // NEWSLETTER SIGNUP COLLECTION
    match /newsletterSignups/{document} {
      allow create: if 
        request.resource.data.email is string &&
        request.resource.data.email.size() > 0 &&
        request.resource.data.email.matches('^[^@]+@[^@]+\\.[^@]+$');
      allow read, update, delete: if request.auth != null;
    }
    
    // ADMIN-ONLY COLLECTIONS
    match /gallery/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /testimonies/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /testimonies_exports/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /settings/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /teamLeads/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /leaders/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /mission_vision/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /service_times/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /about/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /community_service/{document} {
      allow read, write: if request.auth != null;
    }
    
    // DEFAULT RULE - Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Quick Fix Checklist

- [ ] **Deploy updated Firestore rules**
- [ ] **Verify user authentication state**
- [ ] **Check browser console for errors**
- [ ] **Confirm collection names match**
- [ ] **Test with a simple query first**

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing or insufficient permissions` | Collection not in rules | Add collection to firestore.rules |
| `Permission denied` | User not authenticated | Check auth state and login flow |
| `Collection not found` | Wrong collection name | Verify collection name in code |
| `Rules not deployed` | Rules not updated | Deploy firestore rules |

## Support

If issues persist after following this guide:
1. Check Firebase Console for error logs
2. Verify authentication in Firebase Auth
3. Test rules in Firebase Console Rules Playground
4. Check network tab for failed requests
