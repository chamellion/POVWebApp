import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export async function signInWithGoogle() {
  console.log('🔐 Starting Google sign-in process...');
  
  try {
    console.log('🚀 Creating Google Auth provider...');
    const provider = new GoogleAuthProvider();
    
    // Add custom parameters for better UX
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('🔄 Attempting sign-in with popup...');
    const result = await signInWithPopup(auth, provider);
    console.log('✅ Google sign-in successful');
    return result;
  } catch (error) {
    console.error('❌ Google sign-in failed:', error);
    // Handle specific Firebase auth errors
    const firebaseError = error as { code: string; message: string };
    switch (firebaseError.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled. Please try again.');
      case 'auth/popup-blocked':
        throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
      case 'auth/configuration-not-found':
        throw new Error('Google sign-in is not configured. Please contact the administrator.');
      case 'auth/unauthorized-domain':
        throw new Error('This domain is not authorized for sign-in.');
      default:
        throw new Error(`Sign-in failed: ${firebaseError.message}`);
    }
  }
} 