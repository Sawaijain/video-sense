const mongoose = require('mongoose');

const frameResultSchema = new mongoose.Schema(
  {
    timestamp: Number,
    framePath: String,
    label: { type: String, enum: ['safe', 'flagged'] },
    confidence: Number,
  },
  { _id: false }
);

const sensitivityResultSchema = new mongoose.Schema(
  {
    overallLabel: { type: String, enum: ['safe', 'flagged'], default: null },
    confidence: { type: Number, default: 0 },
    framesAnalyzed: { type: Number, default: 0 },
    flaggedFrames: { type: Number, default: 0 },
    frameResults: [frameResultSchema],
    completedAt: Date,
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    originalName: String,
    filename: String,
    filepath: String,
    mimetype: String,
    size: Number,
    cloudinaryId: { type: String, default: null },
    cloudinaryUrl: { type: String, default: null },
    storageType: { type: String, enum: ['local', 'cloudinary'], default: 'local' },
    duration: { type: Number, default: null },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    sensitivityResult: {
      type: sensitivityResultSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

videoSchema.index({ uploadedBy: 1, status: 1 });
videoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);
