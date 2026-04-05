export default function UploadProgress({ uploadPercent, processingData }) {
  const isProcessing = processingData && uploadPercent >= 100;

  return (
    <div className="mt-6 space-y-4">
      {/* Upload progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 font-medium">
            {uploadPercent < 100 ? 'Uploading...' : 'Upload complete'}
          </span>
          <span className="text-gray-500">{uploadPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadPercent}%` }}
          />
        </div>
      </div>

      {/* Processing progress */}
      {isProcessing && processingData && (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 font-medium">
              {processingData.message || `Processing: ${processingData.phase}`}
            </span>
            <span className="text-gray-500">{processingData.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingData.percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
