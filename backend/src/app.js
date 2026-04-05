const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/video.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigins = env.corsOrigin.split(',').map((o) => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
