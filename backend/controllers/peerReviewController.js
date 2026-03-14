const PeerReview = require('../models/PeerReview');

// @desc    Create a peer review
// @route   POST /api/peer-reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { projectId, teamId, revieweeId, rating, strengths, improvements, comments } = req.body;
    
    // Check if user already reviewed this person for this project
    const existing = await PeerReview.findOne({
      project: projectId,
      reviewer: req.user.id,
      reviewee: revieweeId,
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this teammate' 
      });
    }
    
    const review = await PeerReview.create({
      project: projectId,
      team: teamId || null,
      reviewer: req.user.id,
      reviewee: revieweeId,
      rating,
      strengths,
      improvements,
      comments,
    });
    
    await review.populate('reviewer', 'name email');
    await review.populate('reviewee', 'name email');
    
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reviews for a project
// @route   GET /api/peer-reviews/project/:projectId
// @access  Private
const getProjectReviews = async (req, res) => {
  try {
    const reviews = await PeerReview.find({ project: req.params.projectId })
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my reviews (given and received)
// @route   GET /api/peer-reviews/my-reviews/:projectId
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const given = await PeerReview.find({ 
      project: req.params.projectId,
      reviewer: req.user.id 
    }).populate('reviewee', 'name email');
    
    const received = await PeerReview.find({ 
      project: req.params.projectId,
      reviewee: req.user.id 
    }).populate('reviewer', 'name email');
    
    res.json({ 
      success: true, 
      reviews: { given, received } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  getProjectReviews,
  getMyReviews,
};
