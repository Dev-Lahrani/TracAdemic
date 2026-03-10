const path = require('path');
const Document = require('../models/Document');
const DocumentRequest = require('../models/DocumentRequest');
const Team = require('../models/Team');
const Project = require('../models/Project');

// @desc    Create a document request (faculty)
// @route   POST /api/documents/requests
// @access  Private (Professor)
const createDocumentRequest = async (req, res) => {
  try {
    const { projectId, teamId, title, description, documentType, dueDate } = req.body;
    const request = await DocumentRequest.create({
      project: projectId,
      team: teamId || null,
      requestedBy: req.user.id,
      title,
      description,
      documentType,
      dueDate,
    });
    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get document requests for a project
// @route   GET /api/documents/requests/project/:projectId
// @access  Private
const getDocumentRequests = async (req, res) => {
  try {
    const query = { project: req.params.projectId };
    if (req.query.teamId) query.team = req.query.teamId;

    const requests = await DocumentRequest.find(query)
      .populate('requestedBy', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests, count: requests.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload a document (student)
// @route   POST /api/documents/upload
// @access  Private (Student)
const uploadDocument = async (req, res) => {
  try {
    const { projectId, teamId, title, description, type, externalUrl, requestId } = req.body;

    let fileUrl, fileName, fileSize, mimeType;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    } else if (!externalUrl) {
      return res.status(400).json({ success: false, message: 'Either a file or an external URL is required' });
    }

    const document = await Document.create({
      project: projectId,
      team: teamId || null,
      uploadedBy: req.user.id,
      title,
      description,
      type,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      externalUrl,
      requestId: requestId || null,
    });

    await document.populate('uploadedBy', 'name email');

    // Update request status if linked
    if (requestId) {
      await DocumentRequest.findByIdAndUpdate(requestId, { status: 'submitted' });
    }

    res.status(201).json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get documents for a project
// @route   GET /api/documents/project/:projectId
// @access  Private
const getProjectDocuments = async (req, res) => {
  try {
    const query = { project: req.params.projectId };
    if (req.query.teamId) query.team = req.query.teamId;
    if (req.query.status) query.status = req.query.status;

    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email')
      .populate('team', 'name')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, documents, count: documents.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review a document (faculty: approve/reject/request revision)
// @route   PUT /api/documents/:id/review
// @access  Private (Professor)
const reviewDocument = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const allowed = ['approved', 'rejected', 'revision_requested'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status' });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status, feedback, reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    ).populate('uploadedBy', 'name email');

    if (!document) return res.status(404).json({ success: false, message: 'Document not found' });

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDocumentRequest,
  getDocumentRequests,
  uploadDocument,
  getProjectDocuments,
  reviewDocument,
};
