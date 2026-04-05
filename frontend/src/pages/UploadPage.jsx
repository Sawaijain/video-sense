import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpload } from '../hooks/useUpload';
import { useSocket } from '../hooks/useSocket';
import UploadDropzone from '../components/video/UploadDropzone';
import UploadProgress from '../components/video/UploadProgress';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [processingData, setProcessingData] = useState(null);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const { uploadVideo, uploading, uploadProgress, error } = useUpload();
  const socket = useSocket();
  const navigate = useNavigate();

  // Listen for processing events
  useEffect(() => {
    if (!socket || !uploadedVideoId) return;

    const onProgress = (data) => {
      if (data.videoId === uploadedVideoId) {
        setProcessingData(data);
      }
    };

    const onCompleted = (data) => {
      if (data.videoId === uploadedVideoId) {
        setProcessingData({ phase: 'completed', percent: 100, message: 'Processing complete!' });
        setTimeout(() => navigate(`/videos/${uploadedVideoId}`), 1500);
      }
    };

    const onFailed = (data) => {
      if (data.videoId === uploadedVideoId) {
        setProcessingData({ phase: 'failed', percent: 0, message: `Failed: ${data.error}` });
      }
    };

    socket.on('video:processing:progress', onProgress);
    socket.on('video:processing:completed', onCompleted);
    socket.on('video:processing:failed', onFailed);

    return () => {
      socket.off('video:processing:progress', onProgress);
      socket.off('video:processing:completed', onCompleted);
      socket.off('video:processing:failed', onFailed);
    };
  }, [socket, uploadedVideoId, navigate]);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    try {
      const video = await uploadVideo(file, title, description);
      setUploadedVideoId(video._id);
    } catch (err) {
      // error handled by hook
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <UploadDropzone onFileSelect={handleFileSelect} disabled={uploading} />

        {file && (
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => { setFile(null); setTitle(''); }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={uploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
            placeholder="Video title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 resize-none"
            placeholder="Describe the video..."
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        {(uploading || uploadedVideoId) && (
          <UploadProgress uploadPercent={uploadProgress} processingData={processingData} />
        )}

        {!uploadedVideoId && (
          <button
            type="submit"
            disabled={!file || !title || uploading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        )}
      </form>
    </div>
  );
}
