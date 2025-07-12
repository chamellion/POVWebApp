import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Note: Firebase Storage doesn't have a direct delete method in v9+
    // You might need to implement this differently or use a Cloud Function
    console.log('Delete image:', url);
  } catch (error) {
    throw error;
  }
}; 