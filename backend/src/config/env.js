const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 524288000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
};
