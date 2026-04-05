const fs = require('fs');
const path = require('path');
const Video = require('../models/Video');
const ApiError = require('../utils/ApiError');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const { useCloudinary } = require('../middleware/upload');

const createVideo = async ({ title, description, file, userId }) => {
  const videoData = {
    title,
    description: description || '',
    originalName: file.originalname,
    mimetype: file.mimetype,
    uploadedBy: userId,
  };

  if (useCloudinary) {
    videoData.filename = file.filename;
    videoData.filepath = file.path;
    videoData.cloudinaryId = file.filename;
    videoData.cloudinaryUrl = file.path;
    videoData.size = file.size || 0;
    videoData.storageType = 'cloudinary';
  } else {
    videoData.filename = file.filename;
    videoData.filepath = file.path;
    videoData.size = file.size;
    videoData.storageType = 'local';
  }

  const video = await Video.create(videoData);
  return video;
};

const listVideos = async (filter, query) => {
  const { status, sensitivityLabel, fromDate, toDate, minSize, maxSize, page = 1, limit = 12, sort = '-createdAt' } = query;
  const dbFilter = { ...filter };

  if (status) dbFilter.status = status;
  if (sensitivityLabel) dbFilter['sensitivityResult.overallLabel'] = sensitivityLabel;
  if (fromDate || toDate) {
    dbFilter.createdAt = {};
    if (fromDate) dbFilter.createdAt.$gte = new Date(fromDate);
    if (toDate) dbFilter.createdAt.$lte = new Date(toDate);
  }
  if (minSize || maxSize) {
    dbFilter.size = {};
    if (minSize) dbFilter.size.$gte = parseInt(minSize);
    if (maxSize) dbFilter.size.$lte = parseInt(maxSize);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [videos, total] = await Promise.all([
    Video.find(dbFilter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email'),
    Video.countDocuments(dbFilter),
  ]);

  return {
    videos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

const getVideo = async (id, filter) => {
  const video = await Video.findOne({ _id: id, ...filter }).populate('uploadedBy', 'name email');
  if (!video) throw new ApiError(404, 'Video not found');
  return video;
};

const updateVideo = async (id, updates, filter) => {
  const video = await Video.findOneAndUpdate(
    { _id: id, ...filter },
    { $set: updates },
    { new: true }
  );
  if (!video) throw new ApiError(404, 'Video not found');
  return video;
};

const deleteVideo = async (id, filter) => {
  const video = await Video.findOne({ _id: id, ...filter });
  if (!video) throw new ApiError(404, 'Video not found');

  if (video.storageType === 'cloudinary' && video.cloudinaryId) {
    // Delete video from Cloudinary
    try {
      await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
    } catch (err) {
      console.error('Cloudinary video delete error:', err.message);
    }

    // Delete frames from Cloudinary (they're stored with prefix)
    try {
      await cloudinary.api.delete_resources_by_prefix(`videosense/frames/${id}`, { resource_type: 'image' });
    } catch (err) {
      console.error('Cloudinary frames delete error:', err.message);
    }
  } else {
    // Delete local video file
    if (video.filepath && fs.existsSync(video.filepath)) {
      fs.unlinkSync(video.filepath);
    }

    // Delete local extracted frames
    const framesDir = path.join(env.uploadDir, 'frames', id);
    if (fs.existsSync(framesDir)) {
      fs.rmSync(framesDir, { recursive: true });
    }
  }

  await Video.findByIdAndDelete(id);
  return video;
};

module.exports = { createVideo, listVideos, getVideo, updateVideo, deleteVideo };
