const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // JWT auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, env.jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    console.log(`Socket connected: user ${userId}`);

    socket.on('video:subscribe', ({ videoId }) => {
      socket.join(`video:${videoId}`);
    });

    socket.on('video:unsubscribe', ({ videoId }) => {
      socket.leave(`video:${videoId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
