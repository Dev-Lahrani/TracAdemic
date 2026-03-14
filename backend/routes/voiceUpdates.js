const express = require('express');
const router = express.Router();
const {
  uploadVoiceUpdate,
  getVoiceUpdates,
  analyzeEmotion,
  generateTranscript,
} = require('../controllers/voiceUpdateController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'voice-updates');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for audio/video files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime',
  ];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

router.use(protect);

// Upload voice/video update
router.post('/upload', authorize('student'), upload.single('file'), uploadVoiceUpdate);

// Get voice updates for a project
router.get('/project/:projectId', getVoiceUpdates);

// Analyze emotion from voice
router.post('/analyze-emotion', authorize('student'), analyzeEmotion);

// Generate transcript
router.post('/transcript', authorize('student'), generateTranscript);

module.exports = router;
