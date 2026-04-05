const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const pLimit = require('p-limit');
const Video = require('../models/Video');
const { probe, extractFrame } = require('../utils/ffmpeg');
const { classifyFrame } = require('../utils/mockClassifier');
const { emitStarted, emitProgress, emitFrame, emitCompleted, emitFailed } = require('../socket/processingEvents');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

const limit = pLimit(2); // Max 2 concurrent processing jobs

// Download a file from URL to local path
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

// Upload a frame image to Cloudinary
const uploadFrameToCloudinary = (framePath, videoId, frameIndex) => {
  return cloudinary.uploader.upload(framePath, {
    folder: `videosense/frames/${videoId}`,
    public_id: `frame_${frameIndex}`,
    resource_type: 'image',
  });
};

const start = async (videoId) => {
  return limit(async () => {
    let video;
    let tempVideoPath = null;

    try {
      video = await Video.findById(videoId).populate('uploadedBy', '_id');
      if (!video) throw new Error('Video not found');

      const userId = video.uploadedBy._id.toString();
      const isCloudinary = video.storageType === 'cloudinary';

      // Update status to processing
      video.status = 'processing';
      await video.save();
      emitStarted(userId, videoId);

      // Determine the local file path for FFmpeg
      let localFilePath;

      if (isCloudinary) {
        // Download video from Cloudinary to temp location for FFmpeg processing
        const tempDir = path.join(env.uploadDir, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        tempVideoPath = path.join(tempDir, `${videoId}.mp4`);

        emitProgress(userId, videoId, 'downloading', 0, 'Downloading video for analysis...');
        await downloadFile(video.cloudinaryUrl, tempVideoPath);
        localFilePath = tempVideoPath;
      } else {
        localFilePath = video.filepath;
      }

      // Phase 1: Probe video
      emitProgress(userId, videoId, 'extracting_frames', 0, 'Analyzing video metadata...');
      const metadata = await probe(localFilePath);
      video.duration = metadata.duration;
      await video.save();

      // Phase 2: Extract frames
      const duration = metadata.duration || 10;
      const interval = 2; // every 2 seconds
      const maxFrames = 30;
      const totalFrames = Math.min(Math.ceil(duration / interval), maxFrames);
      const framesDir = path.join(env.uploadDir, 'frames', videoId);

      const frameResults = [];

      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * interval;
        const framePath = path.join(framesDir, `frame_${i}.jpg`);

        try {
          await extractFrame(localFilePath, timestamp, framePath);
        } catch (err) {
          console.error(`Frame extraction failed at ${timestamp}s:`, err.message);
          continue;
        }

        const percent = Math.round((i / totalFrames) * 50);
        emitProgress(userId, videoId, 'extracting_frames', percent, `Extracting frame ${i + 1}/${totalFrames}`);
      }

      // Phase 3: Classify each frame (and upload to Cloudinary if needed)
      emitProgress(userId, videoId, 'analyzing', 50, 'Starting sensitivity analysis...');

      for (let i = 0; i < totalFrames; i++) {
        const framePath = path.join(framesDir, `frame_${i}.jpg`);
        const timestamp = i * interval;

        if (!fs.existsSync(framePath)) continue;

        const result = await classifyFrame();

        let storedFramePath = framePath;
        if (isCloudinary) {
          try {
            const uploadResult = await uploadFrameToCloudinary(framePath, videoId, i);
            storedFramePath = uploadResult.secure_url;
          } catch (err) {
            console.error(`Frame upload to Cloudinary failed for frame ${i}:`, err.message);
          }
        }

        frameResults.push({
          timestamp,
          framePath: storedFramePath,
          label: result.label,
          confidence: result.confidence,
        });

        emitFrame(userId, videoId, i, totalFrames, result.label, result.confidence);
        const percent = 50 + Math.round((i / totalFrames) * 45);
        emitProgress(userId, videoId, 'analyzing', percent, `Analyzing frame ${i + 1}/${totalFrames}`);
      }

      // Phase 4: Aggregate results
      emitProgress(userId, videoId, 'finalizing', 95, 'Finalizing results...');

      const flaggedCount = frameResults.filter((f) => f.label === 'flagged').length;
      const avgConfidence =
        frameResults.length > 0
          ? frameResults.reduce((sum, f) => sum + f.confidence, 0) / frameResults.length
          : 0;

      const sensitivityResult = {
        overallLabel: flaggedCount > 0 ? 'flagged' : 'safe',
        confidence: parseFloat(avgConfidence.toFixed(3)),
        framesAnalyzed: frameResults.length,
        flaggedFrames: flaggedCount,
        frameResults,
        completedAt: new Date(),
      };

      video.sensitivityResult = sensitivityResult;
      video.status = 'completed';
      await video.save();

      emitCompleted(userId, videoId, sensitivityResult);
      console.log(`Processing completed for video ${videoId}: ${sensitivityResult.overallLabel}`);
    } catch (error) {
      console.error(`Processing failed for video ${videoId}:`, error.message);

      if (video) {
        video.status = 'failed';
        await video.save();
        const userId = video.uploadedBy._id
          ? video.uploadedBy._id.toString()
          : video.uploadedBy.toString();
        emitFailed(userId, videoId, error.message);
      }
    } finally {
      // Clean up temp downloaded video
      if (tempVideoPath && fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }

      // Clean up local frames if using Cloudinary (they've been uploaded)
      if (video && video.storageType === 'cloudinary') {
        const framesDir = path.join(env.uploadDir, 'frames', videoId);
        if (fs.existsSync(framesDir)) {
          fs.rmSync(framesDir, { recursive: true });
        }
      }
    }
  });
};

module.exports = { start };
