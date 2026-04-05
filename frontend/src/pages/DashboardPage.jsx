import { useState, useEffect } from 'react';
import { useVideos } from '../hooks/useVideos';
import { useSocket } from '../hooks/useSocket';
import VideoCard from '../components/video/VideoCard';
import VideoFilters from '../components/video/VideoFilters';
import Spinner from '../components/common/Spinner';

export default function DashboardPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 12 });
  const { videos, pagination, loading, error, refetch } = useVideos(filters);
  const socket = useSocket();

  // Refetch when a video finishes processing
  useEffect(() => {
    if (!socket) return;
    const handler = () => refetch();
    socket.on('video:processing:completed', handler);
    socket.on('video:processing:failed', handler);
    return () => {
      socket.off('video:processing:completed', handler);
      socket.off('video:processing:failed', handler);
    };
  }, [socket, refetch]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
        {pagination && (
          <span className="text-sm text-gray-500">
            {pagination.total} video{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <VideoFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <Spinner size="lg" />
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No videos found</p>
          <p className="text-sm mt-1">Upload your first video to get started!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                  className={`px-3 py-1 rounded text-sm ${
                    pagination.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
