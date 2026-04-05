import { Link } from 'react-router-dom';

const statusStyles = {
  uploaded: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const labelStyles = {
  safe: 'bg-green-100 text-green-700',
  flagged: 'bg-red-100 text-red-700',
};

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoCard({ video }) {
  return (
    <Link
      to={`/videos/${video._id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm truncate">{video.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[video.status]}`}>
            {video.status}
          </span>
          {video.sensitivityResult?.overallLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${labelStyles[video.sensitivityResult.overallLabel]}`}>
              {video.sensitivityResult.overallLabel}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{formatSize(video.size)}</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
