const express = require('express');
const router = express.Router();
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

// Routes
router.use(protect);

// Upload voice/video update
router.post('/upload', authorize('student'), upload.single('file'), async (req, res) => {
  try {
    const { projectId, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // In a real implementation, call the transcription service
    const transcription = await transcribeAudio(req.file.path);

    res.status(201).json({
      success: true,
      file: {
        url: `/uploads/voice-updates/${req.file.filename}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      transcription,
      message: 'Voice update uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get voice updates for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    // In a real implementation, query database for voice updates
    res.json({
      success: true,
      updates: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mock transcription function (replace with real service)
async function transcribeAudio(filePath) {
  // Simulate transcription delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    text: 'This is a transcribed audio update. In production, this would be converted from actual audio using a speech-to-text service.',
    confidence: 0.95,
    duration: 0,
    language: 'en-US',
  };
}

module.exports = router;
