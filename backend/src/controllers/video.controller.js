const fs = require('fs');
const path = require('path');
const videoService = require('../services/video.service');
const processingService = require('../services/processing.service');
const ApiError = require('../utils/ApiError');

const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No video file provided');

    const { title, description } = req.body;
    if (!title) throw new ApiError(400, 'Title is required');

    const video = await videoService.createVideo({
      title,
      description,
      file: req.file,
      userId: req.user._id,
    });

    // Fire-and-forget processing
    processingService.start(video._id.toString());

    res.status(201).json({ success: true, data: video });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const listVideos = async (req, res, next) => {
  try {
    const result = await videoService.listVideos(req.tenantFilter, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getVideo = async (req, res, next) => {
  try {
    const video = await videoService.getVideo(req.params.id, req.tenantFilter);
    res.json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
};

const updateVideo = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const video = await videoService.updateVideo(
      req.params.id,
      { title, description },
      req.tenantFilter
    );
    res.json({ success: true, data: video });
  } catch (error) {
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    await videoService.deleteVideo(req.params.id, req.tenantFilter);
    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
};

const streamVideo = async (req, res, next) => {
  try {
    const video = await videoService.getVideo(req.params.id, req.tenantFilter);

    // Cloudinary: redirect to the cloud URL for streaming
    if (video.storageType === 'cloudinary' && video.cloudinaryUrl) {
      return res.redirect(video.cloudinaryUrl);
    }

    // Local: serve file with range request support
    if (!fs.existsSync(video.filepath)) {
      throw new ApiError(404, 'Video file not found on disk');
    }

    const stat = fs.statSync(video.filepath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = fs.createReadStream(video.filepath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimetype,
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype,
      });
      fs.createReadStream(video.filepath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
};

const reprocessVideo = async (req, res, next) => {
  try {
    const video = await videoService.getVideo(req.params.id, req.tenantFilter);
    video.status = 'uploaded';
    video.sensitivityResult = {};
    await video.save();

    processingService.start(video._id.toString());
    res.json({ success: true, message: 'Reprocessing started' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadVideo, listVideos, getVideo, updateVideo, deleteVideo, streamVideo, reprocessVideo };
