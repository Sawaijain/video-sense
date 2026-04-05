const { getIO } = require('../config/socket');

const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
};

const emitStarted = (userId, videoId) => {
  emitToUser(userId, 'video:processing:started', { videoId });
};

const emitProgress = (userId, videoId, phase, percent, message) => {
  emitToUser(userId, 'video:processing:progress', {
    videoId,
    phase,
    percent,
    message,
  });
};

const emitFrame = (userId, videoId, frameIndex, totalFrames, label, confidence) => {
  emitToUser(userId, 'video:processing:frame', {
    videoId,
    frameIndex,
    totalFrames,
    label,
    confidence,
  });
};

const emitCompleted = (userId, videoId, result) => {
  emitToUser(userId, 'video:processing:completed', { videoId, result });
};

const emitFailed = (userId, videoId, error) => {
  emitToUser(userId, 'video:processing:failed', { videoId, error });
};

module.exports = { emitStarted, emitProgress, emitFrame, emitCompleted, emitFailed };
