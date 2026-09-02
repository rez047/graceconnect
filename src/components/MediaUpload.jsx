// components/MediaUpload.jsx
import React, { useState, useRef } from 'react';
import { MediaStorageService } from '../services/mediaStorage';

export default function MediaUpload({ onUpload, folder, multiple = false }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    
    try {
      const results = await MediaStorageService.uploadMultiple(
        files, 
        folder,
        { userId: currentUser.uid, category: folder }
      );
      
      onUpload(results);
      alert(`${results.length} file(s) uploaded successfully!`);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div 
      className="media-upload"
      onClick={() => fileInputRef.current?.click()}
    >
      <i className="fas fa-cloud-upload-alt"></i>
      <span>{uploading ? `Uploading... ${progress}%` : 'Tap to upload media'}</span>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}