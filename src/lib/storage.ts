import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Check if Firebase is initialized
const isFirebaseInitialized = () => {
  return storage !== null;
};

export interface UploadProgress {
  progress: number;
  downloadURL?: string;
}

export const uploadImage = async (
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Storage is not initialized');
  }

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage!, `${folder}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        // Provide more specific error messages
        if (error.code === 'storage/unauthorized') {
          reject(new Error('Upload failed: You are not authorized to upload files. Please make sure you are logged in.'));
        } else if (error.code === 'storage/quota-exceeded') {
          reject(new Error('Upload failed: Storage quota exceeded.'));
        } else if (error.code === 'storage/retry-limit-exceeded') {
          reject(new Error('Upload failed: Network error. Please try again.'));
        } else {
          reject(new Error(`Upload failed: ${error.message}`));
        }
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Download URL error:', error);
          reject(new Error('Failed to get download URL after upload.'));
        }
      }
    );
  });
};

export const deleteImage = async (url: string): Promise<void> => {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Storage is not initialized');
  }

  try {
    // Extract the path from the Firebase Storage URL
    // URLs look like: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    
    if (!pathMatch || !pathMatch[1]) {
      console.warn('Could not parse storage path from URL:', url);
      return; // Don't throw error, just log warning
    }
    
    // Decode the path (it's URL encoded)
    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage!, filePath);
    
    await deleteObject(storageRef);
    console.log('✅ Image deleted from storage:', filePath);
  } catch (error) {
    console.error('Error deleting image from storage:', error);
    // Don't throw error - we still want to delete from Firestore even if storage delete fails
    console.warn('⚠️ Continuing with Firestore deletion despite storage error');
  }
}; 