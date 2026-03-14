const fs = require('fs');

// @desc    Upload voice/video update
// @route   POST /api/voice-updates/upload
// @access  Private (Student)
const uploadVoiceUpdate = async (req, res) => {
  try {
    const { projectId, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Analyze the uploaded file
    const analysis = await analyzeFile(req.file);
    
    // Simulate transcription
    const transcription = await simulateTranscription(req.file);

    res.status(201).json({
      success: true,
      file: {
        url: `/uploads/voice-updates/${req.file.filename}`,
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        duration: analysis.duration,
      },
      transcription: transcription.text,
      emotion: analysis.emotion,
      confidence: transcription.confidence,
      analysis,
      message: 'Voice update uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get voice updates for a project
// @route   GET /api/voice-updates/project/:projectId
// @access  Private
const getVoiceUpdates = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // In production, query database
    res.json({
      success: true,
      projectId,
      updates: [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Analyze emotion from voice
// @route   POST /api/voice-updates/analyze-emotion
// @access  Private (Student)
const analyzeEmotion = async (req, res) => {
  try {
    const { text } = req.body;
    
    const emotion = analyzeTextEmotion(text);
    
    res.json({
      success: true,
      emotion,
      analysis: {
        sentiment: emotion.sentiment,
        confidence: emotion.confidence,
        keywords: extractKeywords(text),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate transcript
// @route   POST /api/voice-updates/transcript
// @access  Private (Student)
const generateTranscript = async (req, res) => {
  try {
    const { filePath } = req.body;
    
    const transcript = await simulateTranscription({ path: filePath });
    
    res.json({
      success: true,
      transcript,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
async function analyzeFile(file) {
  const stats = fs.statSync(file.path);
  
  return {
    duration: Math.round(stats.size / 1000), // Mock duration in seconds
    format: file.mimetype,
    size: stats.size,
    emotion: {
      sentiment: 'positive',
      confidence: 0.85,
      dominant: 'neutral',
    },
  };
}

async function simulateTranscription(file) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    text: 'This is a simulated transcription of your voice update. In production, this would use actual speech-to-text technology.',
    confidence: 0.92,
    duration: 0,
    language: 'en-US',
    words: 12,
  };
}

function analyzeTextEmotion(text) {
  const positiveWords = ['great', 'good', 'excellent', 'amazing', 'perfect', 'completed', 'success'];
  const negativeWords = ['bad', 'terrible', 'failed', 'problem', 'issue', 'blocker', 'stuck'];
  const neutralWords = ['okay', 'fine', 'normal', 'average', 'standard'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  const lowerText = text.toLowerCase();
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  
  return {
    sentiment,
    confidence: Math.min(positiveCount + negativeCount, 5) / 5,
    dominant: sentiment,
    highlights: {
      positive: positiveCount,
      negative: negativeCount,
    },
  };
}

function extractKeywords(text) {
  const words = text.toLowerCase().split(/\W+/);
  const common = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'in', 'on', 'for'];
  const freq = {};
  
  words.forEach(word => {
    if (word.length > 3 && !common.includes(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

module.exports = {
  uploadVoiceUpdate,
  getVoiceUpdates,
  analyzeEmotion,
  generateTranscript,
};
