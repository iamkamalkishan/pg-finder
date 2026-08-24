import { 
  getStorage, 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { getStorageInstance } from '../firebase';
import { STORAGE_PATHS } from '../../constants';

const storage = getStorageInstance();

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
}

export type UploadCallback = (progress: UploadProgress) => void;

export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  contentType?: string,
  onProgress?: UploadCallback
): Promise<string> {
  const fileRef = ref(storage, path);
  
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(fileRef, file, contentType ? { contentType } : undefined);
      
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress,
          });
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  } else {
    await uploadBytes(fileRef, file, contentType ? { contentType } : undefined);
    return getDownloadURL(fileRef);
  }
}

export async function uploadMultipleFiles(
  basePath: string,
  files: { file: Blob | Uint8Array | ArrayBuffer; name: string; contentType?: string }[],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> {
  const uploadPromises = files.map(async (fileData, index) => {
    const path = `${basePath}/${Date.now()}_${fileData.name.replace(/\s+/g, '_')}`;
    return uploadFile(path, fileData.file, fileData.contentType, (progress) => {
      onProgress?.(index, progress);
    });
  });
  
  return Promise.all(uploadPromises);
}

export async function deleteFile(path: string): Promise<void> {
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}

export async function deleteFiles(paths: string[]): Promise<void> {
  await Promise.all(paths.map(deleteFile));
}

export async function listFiles(path: string): Promise<string[]> {
  const folderRef = ref(storage, path);
  const result = await listAll(folderRef);
  return result.items.map(item => item.fullPath);
}

export async function getFileURL(path: string): Promise<string> {
  const fileRef = ref(storage, path);
  return getDownloadURL(fileRef);
}

// Specific upload functions for different file types

export async function uploadUserAvatar(userId: string, file: Blob | Uint8Array | ArrayBuffer, onProgress?: UploadCallback): Promise<string> {
  const path = `${STORAGE_PATHS.USER_AVATARS}/${userId}_${Date.now()}.jpg`;
  return uploadFile(path, file, 'image/jpeg', onProgress);
}

export async function uploadPGPhotos(pgId: string, files: { file: Blob | Uint8Array | ArrayBuffer; name: string }[], onProgress?: (index: number, progress: UploadProgress) => void): Promise<string[]> {
  const basePath = `${STORAGE_PATHS.PG_PHOTOS}/${pgId}`;
  return uploadMultipleFiles(basePath, files, onProgress);
}

export async function uploadPGDocuments(pgId: string, files: { file: Blob | Uint8Array | ArrayBuffer; name: string; contentType?: string }[], onProgress?: (index: number, progress: UploadProgress) => void): Promise<string[]> {
  const basePath = `${STORAGE_PATHS.PG_DOCUMENTS}/${pgId}`;
  return uploadMultipleFiles(basePath, files, onProgress);
}

export async function uploadOwnerDocuments(ownerId: string, files: { file: Blob | Uint8Array | ArrayBuffer; name: string; contentType?: string }[], onProgress?: (index: number, progress: UploadProgress) => void): Promise<string[]> {
  const basePath = `${STORAGE_PATHS.OWNER_DOCUMENTS}/${ownerId}`;
  return uploadMultipleFiles(basePath, files, onProgress);
}

export async function uploadChatImage(enquiryId: string, file: Blob | Uint8Array | ArrayBuffer, onProgress?: UploadCallback): Promise<string> {
  const path = `${STORAGE_PATHS.CHAT_IMAGES}/${enquiryId}/${Date.now()}.jpg`;
  return uploadFile(path, file, 'image/jpeg', onProgress);
}

export async function uploadChatDocument(enquiryId: string, file: Blob | Uint8Array | ArrayBuffer, fileName: string, contentType?: string, onProgress?: UploadCallback): Promise<string> {
  const path = `${STORAGE_PATHS.CHAT_DOCUMENTS}/${enquiryId}/${Date.now()}_${fileName}`;
  return uploadFile(path, file, contentType, onProgress);
}

export async function uploadReviewPhotos(reviewId: string, files: { file: Blob | Uint8Array | ArrayBuffer; name: string }[], onProgress?: (index: number, progress: UploadProgress) => void): Promise<string[]> {
  const basePath = `${STORAGE_PATHS.REVIEW_PHOTOS}/${reviewId}`;
  return uploadMultipleFiles(basePath, files, onProgress);
}

export async function deletePGPhotos(pgId: string, photoPaths: string[]): Promise<void> {
  await deleteFiles(photoPaths);
}

export async function deleteUserAvatar(userId: string): Promise<void> {
  const path = `${STORAGE_PATHS.USER_AVATARS}/${userId}`;
  try {
    const files = await listFiles(path);
    await deleteFiles(files);
  } catch (error) {
    // Folder might not exist
  }
}