require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const updateRoutes = require('./routes/updates');
const teamRoutes = require('./routes/teams');
const aiRoutes = require('./routes/ai');
const documentRoutes = require('./routes/documents');
const doubtRoutes = require('./routes/doubts');
const evaluationRoutes = require('./routes/evaluations');
const industryRoutes = require('./routes/industry');
const githubRoutes = require('./routes/github');
const peerReviewRoutes = require('./routes/peerReviews');
const codeReviewRoutes = require('./routes/codeReview');
const voiceUpdatesRoutes = require('./routes/voiceUpdates');
const assignmentRoutes = require('./routes/assignments');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please slow down.' },
  skip: () => process.env.NODE_ENV === 'test',
});

app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'trackAcademic API' });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/peer-reviews', peerReviewRoutes);
app.use('/api/code-review', codeReviewRoutes);
app.use('/api/voice-updates', voiceUpdatesRoutes);
app.use('/api/assignments', assignmentRoutes);

// Serve voice/video uploads
app.use('/uploads/voice-updates', express.static(path.join(__dirname, 'uploads/voice-updates')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 trackAcademic API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  });
}

module.exports = app;
