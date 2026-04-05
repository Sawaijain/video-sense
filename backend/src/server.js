const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const env = require('./config/env');

const startServer = async () => {
  await connectDB();

  // Ensure upload directories exist
  for (const dir of ['videos', 'frames', 'temp']) {
    const dirPath = path.resolve(env.uploadDir, dir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
