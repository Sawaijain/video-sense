import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import VideoPlayer from '../components/video/VideoPlayer';
import SensitivityReport from '../components/video/SensitivityReport';
import Spinner from '../components/common/Spinner';

export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(null);

  useEffect(() => {
    api
      .get(`/videos/${id}`)
      .then((res) => setVideo(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load video'))
      .finally(() => setLoading(false));
  }, [id]);

  // Listen for real-time processing updates
  useEffect(() => {
    if (!socket || !id) return;

    const onProgress = (data) => {
      if (data.videoId === id) setProcessingProgress(data);
    };

    const onCompleted = (data) => {
      if (data.videoId === id) {
        setProcessingProgress(null);
        // Refetch video
        api.get(`/videos/${id}`).then((res) => setVideo(res.data.data));
      }
    };

    const onFailed = (data) => {
      if (data.videoId === id) {
        setProcessingProgress(null);
        api.get(`/videos/${id}`).then((res) => setVideo(res.data.data));
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
  }, [socket, id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleReprocess = async () => {
    try {
      await api.post(`/videos/${id}/reprocess`);
      setVideo((v) => ({ ...v, status: 'processing', sensitivityResult: {} }));
    } catch (err) {
      alert(err.response?.data?.message || 'Reprocess failed');
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
  if (!video) return null;

  const canManage = user?.role === 'admin' || user?.role === 'editor';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        &larr; Back to Library
      </button>

      {/* Video player */}
      {video.status === 'completed' && <VideoPlayer videoId={video._id} />}

      {/* Processing status */}
      {video.status === 'processing' && (
        <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="text-white mt-4">Processing video...</p>
          {processingProgress && (
            <div className="w-64 mt-4">
              <div className="text-gray-300 text-xs text-center mb-1">
                {processingProgress.message} ({processingProgress.percent}%)
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {video.status === 'failed' && (
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <p className="text-red-400">Processing failed. Try reprocessing.</p>
        </div>
      )}

      {video.status === 'uploaded' && (
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Waiting for processing to start...</p>
        </div>
      )}

      {/* Video info */}
      <div className="mt-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            {video.description && (
              <p className="text-gray-600 mt-1">{video.description}</p>
            )}
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={handleReprocess}
                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                Reprocess
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Size: {(video.size / (1024 * 1024)).toFixed(1)} MB</span>
          {video.duration && <span>Duration: {Math.round(video.duration)}s</span>}
          <span>Uploaded: {new Date(video.createdAt).toLocaleString()}</span>
          {video.uploadedBy && <span>By: {video.uploadedBy.name}</span>}
        </div>

        {/* Sensitivity report */}
        <SensitivityReport result={video.sensitivityResult} />
      </div>
    </div>
  );
}
