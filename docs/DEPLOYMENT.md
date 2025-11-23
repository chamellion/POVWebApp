# Deployment Guide

## 🚀 Deploy to Vercel

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Step 2: Set Up Firebase

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name: `rccg-pov-admin`
   - Follow setup wizard

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode"
   - Select location closest to your users

4. **Set Up Storage**
   - Go to Storage
   - Click "Get started"
   - Choose "Start in production mode"
   - Select same location as Firestore

5. **Configure Security Rules**

   **Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   **Storage Rules:**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

6. **Get Firebase Config**
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click "Add app" > Web
   - Copy the config object

### Step 3: Deploy to Vercel

1. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com/)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Environment Variables**
   In Vercel project settings, add these environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_APP_NAME="RCCG Place of Victory Admin"
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Step 4: Configure Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Firebase Authorized Domains**
   - Go to Firebase Console > Authentication > Settings
   - Add your custom domain to "Authorized domains"

## 🔧 Post-Deployment Setup

### 1. First Login
- Visit your deployed app
- Sign up with email/password or Google
- You'll be redirected to the dashboard

### 2. Initial Content Setup
- **Settings**: Configure your site settings first
- **Leaders**: Add church leaders
- **Events**: Schedule upcoming events
- **Gallery**: Upload community photos
- **Testimonies**: Add member stories

### 3. Test All Features
- ✅ Authentication (sign up, sign in, sign out)
- ✅ Image uploads (leaders, gallery, testimonies)
- ✅ CRUD operations for all modules
- ✅ Responsive design on mobile/tablet
- ✅ Form validation
- ✅ Toast notifications

## 📊 Monitoring

### Vercel Analytics
- Monitor performance in Vercel dashboard
- Check build logs for errors
- Monitor function execution

### Firebase Console
- Monitor authentication usage
- Check Firestore read/write operations
- Monitor storage usage
- Review security rules

## 🔒 Security Checklist

- [ ] Firebase security rules configured
- [ ] Environment variables set in Vercel
- [ ] Custom domain added to Firebase authorized domains
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Authentication methods configured

## 🐛 Troubleshooting

### Build Failures
- Check Vercel build logs
- Ensure all dependencies are installed
- Verify TypeScript compilation

### Authentication Issues
- Check Firebase config in environment variables
- Verify domain is in authorized domains


### Image Upload Problems
- Check Firebase Storage rules
- Verify storage bucket configuration
- Monitor storage usage limits

## 📈 Scaling Considerations

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month
- **Firebase Auth**: 10,000 users/month
- **Firestore**: 1GB storage, 50K reads/day
- **Storage**: 5GB storage, 1GB downloads/day

### Upgrade Path
- Monitor usage in Firebase console
- Upgrade to paid plans when approaching limits
- Consider CDN for image optimization

## 🎉 Success!

Your RCCG Place of Victory admin dashboard is now live and ready to use! 

**Next Steps:**
1. Share the admin URL with church leaders
2. Train users on content management
3. Set up regular backups
4. Monitor usage and performance

---

**Need Help?** Check the main README.md for detailed documentation and troubleshooting tips. 