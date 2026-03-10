const Doubt = require('../models/Doubt');
const MeetingSchedule = require('../models/MeetingSchedule');

// @desc    Create a doubt
// @route   POST /api/doubts
// @access  Private (Student)
const createDoubt = async (req, res) => {
  try {
    const { projectId, teamId, title, body } = req.body;
    const doubt = await Doubt.create({
      project: projectId,
      team: teamId || null,
      askedBy: req.user.id,
      title,
      body,
    });
    await doubt.populate('askedBy', 'name email role');
    res.status(201).json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get doubts for a project
// @route   GET /api/doubts/project/:projectId
// @access  Private
const getProjectDoubts = async (req, res) => {
  try {
    const query = { project: req.params.projectId };
    if (req.query.status) query.status = req.query.status;
    if (req.query.teamId) query.team = req.query.teamId;

    const doubts = await Doubt.find(query)
      .populate('askedBy', 'name email role')
      .populate('replies.author', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, doubts, count: doubts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a doubt
// @route   POST /api/doubts/:id/reply
// @access  Private
const replyToDoubt = async (req, res) => {
  try {
    const { body, isAccepted } = req.body;
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

    doubt.replies.push({ author: req.user.id, body, isAccepted: !!isAccepted });

    // Auto-update status when faculty replies
    if (req.user.role === 'professor' && doubt.status === 'open') {
      doubt.status = 'answered';
    }

    await doubt.save();
    await doubt.populate('askedBy', 'name email role');
    await doubt.populate('replies.author', 'name email role');
    res.json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Close a doubt
// @route   PUT /api/doubts/:id/close
// @access  Private
const closeDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    ).populate('askedBy', 'name email role');
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });
    res.json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule a meeting
// @route   POST /api/doubts/meetings
// @access  Private (Professor)
const scheduleMeeting = async (req, res) => {
  try {
    const { projectId, teamId, title, description, scheduledAt, durationMinutes, meetingLink, location } = req.body;
    const meeting = await MeetingSchedule.create({
      project: projectId,
      team: teamId || null,
      scheduledBy: req.user.id,
      title,
      description,
      scheduledAt,
      durationMinutes: durationMinutes || 60,
      meetingLink,
      location,
    });
    await meeting.populate('scheduledBy', 'name email');
    res.status(201).json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get meetings for a project
// @route   GET /api/doubts/meetings/project/:projectId
// @access  Private
const getProjectMeetings = async (req, res) => {
  try {
    const meetings = await MeetingSchedule.find({ project: req.params.projectId })
      .populate('scheduledBy', 'name email')
      .populate('team', 'name')
      .sort({ scheduledAt: 1 });
    res.json({ success: true, meetings, count: meetings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update meeting status or add AI summary
// @route   PUT /api/doubts/meetings/:id
// @access  Private (Professor)
const updateMeeting = async (req, res) => {
  try {
    const { status, aiSummary } = req.body;
    const meeting = await MeetingSchedule.findByIdAndUpdate(
      req.params.id,
      { status, aiSummary },
      { new: true }
    ).populate('scheduledBy', 'name email');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, meeting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDoubt,
  getProjectDoubts,
  replyToDoubt,
  closeDoubt,
  scheduleMeeting,
  getProjectMeetings,
  updateMeeting,
};
