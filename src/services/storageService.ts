import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

// Compress image before upload
async function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Upload a photo to Firebase Storage
export async function uploadPhoto(
  file: File,
  reportId: string,
  photoId: string
): Promise<{ url: string; storagePath: string }> {
  // Compress image before uploading
  const compressedBlob = await compressImage(file);

  const storagePath = `reports/${reportId}/photos/${photoId}.jpg`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, compressedBlob, {
    contentType: 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);

  return { url, storagePath };
}

// Upload a photo from data URL (for migrating existing localStorage data)
export async function uploadPhotoFromDataUrl(
  dataUrl: string,
  reportId: string,
  photoId: string
): Promise<{ url: string; storagePath: string }> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const storagePath = `reports/${reportId}/photos/${photoId}.jpg`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
  });

  const url = await getDownloadURL(storageRef);

  return { url, storagePath };
}

// Delete a photo from Firebase Storage
export async function deletePhoto(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.warn('Could not delete photo:', error);
  }
}

// Delete all photos for a report
export async function deleteReportPhotos(photos: { storagePath: string }[]): Promise<void> {
  await Promise.all(photos.map((photo) => deletePhoto(photo.storagePath)));
}
