const labelStyles = {
  safe: 'bg-green-100 text-green-700 border-green-300',
  flagged: 'bg-red-100 text-red-700 border-red-300',
};

export default function SensitivityReport({ result }) {
  if (!result || !result.overallLabel) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-gray-500 text-sm">
        No sensitivity analysis available yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">Sensitivity Report</h3>

      {/* Overall result */}
      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold mb-4 ${labelStyles[result.overallLabel]}`}>
        {result.overallLabel === 'safe' ? 'SAFE' : 'FLAGGED'}
        <span className="ml-2 font-normal">({(result.confidence * 100).toFixed(1)}% confidence)</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-900">{result.framesAnalyzed}</div>
          <div className="text-xs text-gray-500">Frames Analyzed</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {result.framesAnalyzed - result.flaggedFrames}
          </div>
          <div className="text-xs text-gray-500">Safe Frames</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-600">{result.flaggedFrames}</div>
          <div className="text-xs text-gray-500">Flagged Frames</div>
        </div>
      </div>

      {/* Frame timeline */}
      {result.frameResults && result.frameResults.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Frame Analysis Timeline</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {result.frameResults.map((frame, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-gray-50"
              >
                <span className="text-gray-600">
                  Frame {i + 1} ({frame.timestamp}s)
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    frame.label === 'safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {frame.label}
                  </span>
                  <span className="text-gray-400">{(frame.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
