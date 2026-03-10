const IndustryProject = require('../models/IndustryProject');
const Application = require('../models/Application');
const Team = require('../models/Team');
const Evaluation = require('../models/Evaluation');

// @desc    Create an industry project (faculty)
// @route   POST /api/industry
// @access  Private (Professor)
const createIndustryProject = async (req, res) => {
  try {
    const { title, description, company, requiredSkills, domain, difficulty, minTeamSize, maxTeamSize, deadline, stipend } = req.body;
    const project = await IndustryProject.create({
      title,
      description,
      postedBy: req.user.id,
      company,
      requiredSkills: requiredSkills || [],
      domain,
      difficulty,
      minTeamSize: minTeamSize || 1,
      maxTeamSize: maxTeamSize || 5,
      deadline,
      stipend,
    });
    await project.populate('postedBy', 'name email department');
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all open industry projects
// @route   GET /api/industry
// @access  Private
const listIndustryProjects = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.domain) query.domain = req.query.domain;
    if (req.query.difficulty) query.difficulty = req.query.difficulty;

    const projects = await IndustryProject.find(query)
      .populate('postedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.json({ success: true, projects, count: projects.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single industry project with applications (faculty view)
// @route   GET /api/industry/:id
// @access  Private
const getIndustryProject = async (req, res) => {
  try {
    const project = await IndustryProject.findById(req.params.id).populate('postedBy', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Industry project not found' });

    let applications = [];
    if (req.user.role === 'professor') {
      applications = await Application.find({ industryProject: req.params.id })
        .populate('applicantStudent', 'name email department')
        .populate('applicantTeam', 'name')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, project, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Apply to an industry project (student)
// @route   POST /api/industry/:id/apply
// @access  Private (Student)
const applyToIndustryProject = async (req, res) => {
  try {
    const { teamId, coverLetter } = req.body;

    const project = await IndustryProject.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Industry project not found' });
    if (project.status !== 'open') return res.status(400).json({ success: false, message: 'This project is no longer accepting applications' });

    // Check for duplicate application
    const existing = await Application.findOne({ industryProject: req.params.id, applicantStudent: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already applied to this project' });

    const application = await Application.create({
      industryProject: req.params.id,
      applicantStudent: req.user.id,
      applicantTeam: teamId || null,
      coverLetter,
    });

    // Increment application count
    await IndustryProject.findByIdAndUpdate(req.params.id, { $inc: { applicationCount: 1 } });

    await application.populate('applicantStudent', 'name email');
    res.status(201).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review an application (faculty)
// @route   PUT /api/industry/applications/:id/review
// @access  Private (Professor)
const reviewApplication = async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const allowed = ['shortlisted', 'accepted', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid application status' });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status, reviewNotes, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    )
      .populate('applicantStudent', 'name email department')
      .populate('applicantTeam', 'name');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get applicant team's past performance (faculty)
// @route   GET /api/industry/applications/:id/team-profile
// @access  Private (Professor)
const getApplicantTeamProfile = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('applicantStudent', 'name email department')
      .populate('applicantTeam', 'name members');

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    let evaluationHistory = [];
    if (application.applicantStudent) {
      evaluationHistory = await Evaluation.find({ student: application.applicantStudent._id })
        .populate('project', 'title course semester')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, application, evaluationHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createIndustryProject,
  listIndustryProjects,
  getIndustryProject,
  applyToIndustryProject,
  reviewApplication,
  getApplicantTeamProfile,
};
