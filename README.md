# RCCG Place of Victory - Admin Dashboard

A modern, responsive admin dashboard for managing church content, built with Next.js 14, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

- **Authentication**: Firebase Email/Password + Google sign-in
- **Content Management**: CRUD operations for all content types
- **Image Upload**: Firebase Storage with progress tracking
- **Real-time Updates**: Firestore real-time listeners
- **Responsive Design**: Mobile-first approach with responsive sidebar
- **Modern UI**: Built with shadcn/ui components
- **Form Validation**: React Hook Form + Zod validation
- **Toast Notifications**: User-friendly feedback with Sonner

## 📋 Content Modules

1. **Carousel**: Manage homepage carousel slides with drag-and-drop reordering
2. **Leaders**: Manage church leaders with photos, roles, and bios
3. **Events**: Schedule and manage church events and service times
4. **Gallery**: Upload and organize community photos by category
5. **Testimonies**: Share member stories and testimonies
6. **Settings**: Configure site-wide settings and social links

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable

## 🎠 Carousel Management

The carousel management system provides a comprehensive solution for managing homepage carousel slides with the following features:

### Key Features
- **Real-time Updates**: Changes are reflected immediately across all connected clients
- **Drag & Drop Reordering**: Intuitive drag-and-drop interface for reordering slides
- **Order Persistence**: Slide order is automatically saved to Firestore
- **Batch Updates**: Efficient batch operations for optimal performance
- **Visual Feedback**: Order badges and drag handles for clear user guidance

### Technical Implementation
- **Firestore Integration**: Uses `orderBy('order', 'asc')` queries for consistent ordering
- **Real-time Listeners**: `onSnapshot` listeners for instant updates
- **Batch Operations**: `writeBatch` for efficient order updates
- **Error Handling**: Graceful error handling with user feedback
- **Optimistic Updates**: UI updates immediately for smooth user experience

### Usage
1. **Adding Slides**: New slides are automatically assigned the next available order number
2. **Reordering**: Drag slides using the grip handle or use move up/down buttons
3. **Editing**: Click the edit button to modify slide content while preserving order
4. **Visibility**: Toggle slide visibility without affecting order
5. **Deletion**: Remove slides with automatic order recalculation

## 📅 Events Management

The events management system provides comprehensive event handling for church events and service times.

### Key Features
- **Event Management**: Create, edit, and delete church events
- **Real-time Updates**: Live synchronization with Firestore
- **Event Statistics**: Track total events and upcoming events
- **Responsive Design**: Works seamlessly across all devices

### Technical Implementation
- **Firestore Integration**: Direct database operations for event management
- **Real-time Updates**: Live synchronization with Firestore
- **Error Handling**: Graceful fallbacks with user-friendly error messages
- **Type Safety**: Full TypeScript support with proper event interfaces

### Usage
1. **Adding Events**: Create custom events with full details
2. **Event Management**: Edit and delete events as needed
3. **Event Display**: View all events in a clean, organized table
4. **Statistics**: Monitor total events and upcoming events

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd church_dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password + Google)
   - Enable Firestore Database
   - Enable Storage
   - Get your Firebase config

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

   # App Configuration
   NEXT_PUBLIC_APP_NAME="RCCG Place of Victory Admin"
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Firebase Setup

### Authentication
1. Go to Firebase Console > Authentication
2. Enable Email/Password authentication
3. Enable Google authentication
4. Add your domain to authorized domains

### Firestore Database
1. Go to Firebase Console > Firestore Database
2. Create database in production mode
3. Set up security rules (see below)

### Storage
1. Go to Firebase Console > Storage
2. Create storage bucket
3. Set up security rules (see below)

### Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
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
    // Allow authenticated users to upload/delete images
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Environment Variables in Vercel**
   Add all your Firebase environment variables in the Vercel dashboard under Settings > Environment Variables.

### Build Script
The project includes a Vercel build script in `package.json`:
```json
{
  "scripts": {
    "vercel-build": "next build"
  }
}
```

## 📱 Usage

### First Time Setup
1. Visit the admin dashboard
2. Sign up with email/password or Google
3. Start adding content through the dashboard

### Content Management
- **Leaders**: Add church leaders with photos and bios
- **Events**: Schedule events with dates, times, and locations
- **Gallery**: Upload community photos with categories
- **Testimonies**: Share member stories
- **Settings**: Configure site-wide settings

### Image Upload
- Supported formats: JPG, PNG, GIF, WebP
- Automatic compression and optimization
- Progress tracking during upload
- Organized by folders (leaders, gallery, testimonies)

## 🔒 Security Features

- Protected routes with authentication
- Firebase security rules
- Form validation and sanitization
- Secure image upload with type checking
- Environment variable protection

## 📊 Free Tier Limits

### Firebase Free Tier
- **Authentication**: 10,000 users/month
- **Firestore**: 1GB storage, 50,000 reads/day, 20,000 writes/day
- **Storage**: 5GB storage, 1GB downloads/day

### Vercel Free Tier
- **Bandwidth**: 100GB/month
- **Builds**: 6,000 minutes/month
- **Functions**: 100GB-hours/month

## 🐛 Troubleshooting

### Common Issues

1. **Firebase config errors**
   - Ensure all environment variables are set correctly
   - Check Firebase project settings

2. **Image upload failures**
   - Verify Firebase Storage rules
   - Check file size limits (5MB recommended)

3. **Authentication issues**
   - Ensure domain is added to Firebase authorized domains
   

### Development Tips

- Use browser dev tools to check for console errors
- Monitor Firebase console for usage and errors
- Check Vercel deployment logs for build issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for RCCG Place of Victory**
