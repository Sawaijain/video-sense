export default function VideoPlayer({ videoId }) {
  const token = localStorage.getItem('token');
  const streamUrl = `/api/videos/${videoId}/stream?token=${token}`;

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={streamUrl}
        controls
        className="w-full h-full"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
