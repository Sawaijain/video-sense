import { useState } from 'react';
import api from '../api/axios';

export const useUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadVideo = async (file, title, description) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    if (description) formData.append('description', description);

    try {
      const res = await api.post('/videos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setUploadProgress(pct);
        },
      });
      setUploading(false);
      return res.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  return { uploadVideo, uploading, uploadProgress, error };
};
