import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FileText, Upload, Download, Eye, CheckCircle, XCircle, Clock, 
  Trash2, Plus, Filter, Search, File, Image, Video, Presentation,
  AlertCircle, ExternalLink
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const documentTypeIcons = {
  pdf: FileText,
  image: Image,
  video: Video,
  presentation: Presentation,
  document: File,
  github_link: ExternalLink,
  other: File,
};

const documentTypeColors = {
  pdf: 'text-red-500 bg-red-50',
  image: 'text-purple-500 bg-purple-50',
  video: 'text-blue-500 bg-blue-50',
  presentation: 'text-orange-500 bg-orange-50',
  document: 'text-gray-500 bg-gray-50',
  github_link: 'text-green-500 bg-green-50',
  other: 'text-gray-500 bg-gray-50',
};

const DocumentsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    documentType: 'pdf',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [docsRes, requestsRes] = await Promise.all([
        api.get(`/documents/project/${projectId}`),
        api.get(`/documents/requests/project/${projectId}`),
      ]);
      setDocuments(docsRes.data.documents || []);
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/documents/requests', {
        ...newRequest,
        project: projectId,
      });
      toast.success('Document request created successfully');
      setShowRequestForm(false);
      setNewRequest({ title: '', description: '', documentType: 'pdf', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const requestId = e.target.dataset.requestId;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    if (requestId) formData.append('requestId', requestId);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('File uploaded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file');
    }
  };

  const handleReview = async (docId, status) => {
    try {
      await api.put(`/documents/${docId}/review`, { status });
      toast.success(`Document ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update review status');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter;
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.requestId?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <LoadingSpinner text="Loading documents…" />;

  const isProfessor = user?.role === 'professor';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to={isProfessor ? `/professor/projects/${projectId}` : `/student/projects/${projectId}`} className="hover:text-blue-600">
              {isProfessor ? 'Projects' : 'My Projects'}
            </Link>
            <span>/</span>
            <span>Documents</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Management</h1>
        </div>
        
        {isProfessor && (
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Request Document
          </button>
        )}
      </div>

      {/* Request Form */}
      {showRequestForm && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create Document Request</h3>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Project Proposal PDF"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Document Type</label>
                <select
                  className="input-field"
                  value={newRequest.documentType}
                  onChange={(e) => setNewRequest({ ...newRequest, documentType: e.target.value })}
                >
                  <option value="pdf">PDF</option>
                  <option value="document">Word Document</option>
                  <option value="presentation">Presentation</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="github_link">GitHub Link</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Describe what you expect in this document..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Due Date (optional)</label>
              <input
                type="date"
                className="input-field"
                value={newRequest.dueDate}
                onChange={(e) => setNewRequest({ ...newRequest, dueDate: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Create Request</button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Document Requests (Professor View) */}
      {isProfessor && requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.filter(r => r.status === 'open').map((request) => {
              const Icon = documentTypeIcons[request.documentType] || File;
              const colorClass = documentTypeColors[request.documentType] || documentTypeColors.other;
              
              return (
                <div key={request._id} className="card border-l-4 border-yellow-400">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="badge badge-yellow">Pending</span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">{request.title}</h3>
                  {request.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{request.description}</p>
                  )}
                  {request.dueDate && (
                    <p className="text-xs text-gray-400 mb-3">
                      Due: {formatDate(request.dueDate)}
                    </p>
                  )}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <label
                      htmlFor={`upload-${request._id}`}
                      className="btn-primary w-full text-center cursor-pointer text-sm"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />
                      Upload
                    </label>
                    <input
                      id={`upload-${request._id}`}
                      type="file"
                      className="hidden"
                      data-request-id={request._id}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Button for Students */}
      {!isProfessor && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Submit Document</h3>
          {requests.filter(r => r.status === 'open').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.filter(r => r.status === 'open').map((request) => (
                <div key={request._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {React.createElement(documentTypeIcons[request.documentType] || File, {
                      className: `w-5 h-5 ${documentTypeColors[request.documentType]?.split(' ')[0] || 'text-gray-500'}`
                    })}
                    <span className="font-medium text-gray-900 dark:text-white">{request.title}</span>
                  </div>
                  {request.dueDate && (
                    <p className="text-sm text-gray-500 mb-3">Due: {formatDate(request.dueDate)}</p>
                  )}
                  <label
                    htmlFor={`upload-${request._id}`}
                    className="btn-primary w-full text-center cursor-pointer text-sm block"
                  >
                    <Upload className="w-4 h-4 inline mr-1" />
                    Choose File
                  </label>
                  <input
                    id={`upload-${request._id}`}
                    type="file"
                    className="hidden"
                    data-request-id={request._id}
                    onChange={handleFileUpload}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No pending document requests.</p>
          )}
        </div>
      )}

      {/* Documents List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isProfessor ? 'All Documents' : 'My Submissions'}
        </h2>
        
        {filteredDocuments.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">No documents yet</h3>
            <p className="text-gray-400 text-sm mt-1">
              {isProfessor ? 'Create a document request to get started.' : 'Upload documents to fulfill pending requests.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => {
              const Icon = documentTypeIcons[doc.documentType] || File;
              const colorClass = documentTypeColors[doc.documentType] || documentTypeColors.other;
              
              return (
                <div key={doc._id} className="card flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.title || doc.fileName}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>Uploaded {formatDate(doc.createdAt)}</span>
                      {doc.uploadedBy?.name && <span>by {doc.uploadedBy.name}</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.status === 'pending' && (
                      <span className="badge badge-yellow">Pending Review</span>
                    )}
                    {doc.status === 'approved' && (
                      <span className="badge badge-green">Approved</span>
                    )}
                    {doc.status === 'rejected' && (
                      <span className="badge badge-red">Rejected</span>
                    )}
                  </div>
                  
                  {isProfessor && doc.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(doc._id, 'approved')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReview(doc._id, 'rejected')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
