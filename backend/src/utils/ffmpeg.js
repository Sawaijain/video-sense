const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const probe = (filepath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, metadata) => {
      if (err) return reject(err);
      resolve({
        duration: metadata.format.duration || 0,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name,
      });
    });
  });
};

const extractFrame = (filepath, timestamp, outputPath) => {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    ffmpeg(filepath)
      .seekInput(timestamp)
      .frames(1)
      .output(outputPath)
      .outputOptions(['-q:v', '2'])
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

module.exports = { probe, extractFrame };
