import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  MessageCircle, Plus, Send, CheckCircle, XCircle, Clock, 
  ChevronDown, ChevronUp, User, Search, Filter, ThumbsUp
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DoubtsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedDoubt, setExpandedDoubt] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [newDoubt, setNewDoubt] = useState({
    title: '',
    body: '',
  });
  
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    fetchDoubts();
  }, [projectId]);

  const fetchDoubts = async () => {
    try {
      const res = await api.get(`/doubts/project/${projectId}`);
      setDoubts(res.data.doubts || []);
    } catch (err) {
      console.error('Error fetching doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDoubt = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/doubts', {
        ...newDoubt,
        project: projectId,
      });
      toast.success('Doubt posted successfully');
      setShowForm(false);
      setNewDoubt({ title: '', body: '' });
      fetchDoubts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post doubt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (doubtId) => {
    const body = replyText[doubtId];
    if (!body?.trim()) return;
    
    try {
      await api.post(`/doubts/${doubtId}/reply`, { body });
      toast.success('Reply posted');
      setReplyText({ ...replyText, [doubtId]: '' });
      fetchDoubts();
    } catch (err) {
      toast.error('Failed to post reply');
    }
  };

  const handleCloseDoubt = async (doubtId) => {
    try {
      await api.put(`/doubts/${doubtId}/close`);
      toast.success('Doubt closed');
      fetchDoubts();
    } catch (err) {
      toast.error('Failed to close doubt');
    }
  };

  const filteredDoubts = doubts.filter(doubt => {
    const matchesFilter = filter === 'all' || 
      (filter === 'open' && doubt.status === 'open') ||
      (filter === 'answered' && doubt.status === 'answered') ||
      (filter === 'closed' && doubt.status === 'closed');
    const matchesSearch = doubt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doubt.body?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <LoadingSpinner text="Loading doubts…" />;

  const isProfessor = user?.role === 'professor';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to={isProfessor ? `/professor/projects/${projectId}` : `/student/projects/${projectId}`} className="hover:text-blue-600">
              {isProfessor ? 'Projects' : 'My Projects'}
            </Link>
            <span>/</span>
            <span>Q&A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Questions & Answers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ask questions and get help from professors and teammates
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ask Question
        </button>
      </div>

      {/* Question Form */}
      {showForm && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ask a Question</h3>
          <form onSubmit={handleSubmitDoubt} className="space-y-4">
            <div>
              <label className="label">Question Title</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., How do I implement authentication?"
                value={newDoubt.title}
                onChange={(e) => setNewDoubt({ ...newDoubt, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Details</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Provide more context about your question..."
                value={newDoubt.body}
                onChange={(e) => setNewDoubt({ ...newDoubt, body: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Question'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'answered', 'closed'].map((f) => (
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{doubts.filter(d => d.status === 'open').length}</div>
          <div className="text-sm text-gray-500">Open</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{doubts.filter(d => d.status === 'answered').length}</div>
          <div className="text-sm text-gray-500">Answered</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{doubts.filter(d => d.status === 'closed').length}</div>
          <div className="text-sm text-gray-500">Closed</div>
        </div>
      </div>

      {/* Doubts List */}
      {filteredDoubts.length === 0 ? (
        <div className="card text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">No questions yet</h3>
          <p className="text-gray-400 text-sm mt-1">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => {
            const isExpanded = expandedDoubt === doubt._id;
            const isOwner = doubt.askedBy?._id === user?._id;
            
            return (
              <div key={doubt._id} className="card">
                <div 
                  className="cursor-pointer"
                  onClick={() => setExpandedDoubt(isExpanded ? null : doubt._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{doubt.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>{doubt.askedBy?.name || 'Unknown'}</span>
                          <span>•</span>
                          <span>{formatDate(doubt.createdAt)}</span>
                          {doubt.replies?.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{doubt.replies.length} {doubt.replies.length === 1 ? 'reply' : 'replies'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {doubt.status === 'open' && <span className="badge badge-blue">Open</span>}
                      {doubt.status === 'answered' && <span className="badge badge-green">Answered</span>}
                      {doubt.status === 'closed' && <span className="badge badge-gray">Closed</span>}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap mb-4">
                      {doubt.body}
                    </p>
                    
                    {/* Replies */}
                    {doubt.replies?.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {doubt.replies.map((reply, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${reply.isAccepted ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {reply.author?.name || 'Unknown'}
                              </span>
                              {reply.isAccepted && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-xs text-gray-400 ml-auto">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{reply.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reply Form */}
                    {doubt.status !== 'closed' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input-field flex-1"
                          placeholder="Write a reply..."
                          value={replyText[doubt._id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [doubt._id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleReply(doubt._id)}
                        />
                        <button
                          onClick={() => handleReply(doubt._id)}
                          className="btn-primary px-4"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {(isOwner || isProfessor) && doubt.status !== 'closed' && (
                          <button
                            onClick={() => handleCloseDoubt(doubt._id)}
                            className="btn-secondary px-4"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoubtsPage;
