const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const allowedMimetypes = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
];

const useCloudinary = !!(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);

let storage;

if (useCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'videosense/videos',
      resource_type: 'video',
      public_id: () => uuidv4(),
      allowed_formats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    },
  });
} else {
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.resolve(env.uploadDir, 'videos');
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
  storage = diskStorage;
}

const fileFilter = (req, file, cb) => {
  if (allowedMimetypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only video files are allowed (mp4, webm, mov, avi, mkv)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxFileSize },
});

module.exports = upload;
module.exports.useCloudinary = useCloudinary;
