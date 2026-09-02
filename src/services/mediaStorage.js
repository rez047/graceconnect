import { storage } from '../firebase-config';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export class MediaStorageService {
  // Allowed file types
  static ALLOWED_TYPES = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/webm', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    documents: ['application/pdf', 'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  static MAX_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Upload media file
   */
  static async upload(file, folder, metadata = {}) {
    // Validate file type
    const allowedTypes = Object.values(this.ALLOWED_TYPES).flat();
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    // Validate file size
    if (file.size > this.MAX_SIZE) {
      throw new Error('File too large. Max 50MB');
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);

    // Upload with metadata
    const uploadTask = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: metadata.userId,
        category: metadata.category,
        timestamp: new Date().toISOString()
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadTask.ref);

    return {
      url: downloadURL,
      path: fileName,
      type: file.type,
      size: file.size,
      name: file.name
    };
  }

  /**
   * Upload multiple files
   */
  static async uploadMultiple(files, folder, metadata = {}) {
    const uploadPromises = Array.from(files).map(file => 
      this.upload(file, folder, metadata)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete media file
   */
  static async delete(filePath) {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  }

  /**
   * List all files in folder
   */
  static async listFiles(folder) {
    const listRef = ref(storage, folder);
    const res = await listAll(listRef);
    
    const files = await Promise.all(
      res.items.map(async (item) => ({
        path: item.fullPath,
        url: await getDownloadURL(item)
      }))
    );
    
    return files;
  }
}