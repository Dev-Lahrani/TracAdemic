import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Users, Star, MessageSquare, CheckCircle, Clock, User,
  Send, ChevronRight, AlertCircle, ThumbsUp, Award
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PeerReviewPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [selectedReview, setSelectedReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [newReview, setNewReview] = useState({
    revieweeId: '',
    rating: 5,
    strengths: '',
    improvements: '',
    comments: '',
  });

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [reviewsRes, teamsRes] = await Promise.all([
        api.get(`/peer-reviews/project/${projectId}`).catch(() => ({ data: { reviews: [] } })),
        api.get(`/teams/project/${projectId}`).catch(() => ({ data: { teams: [] } })),
      ]);
      setReviews(reviewsRes.data.reviews || []);
      setTeams(teamsRes.data.teams || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/peer-reviews', {
        ...newReview,
        projectId,
      });
      toast.success('Review submitted successfully');
      setNewReview({
        revieweeId: '',
        rating: 5,
        strengths: '',
        improvements: '',
        comments: '',
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getTeamMembers = () => {
    const allMembers = [];
    teams.forEach(team => {
      team.members?.forEach(member => {
        if (member.user?._id !== user?._id) {
          allMembers.push({
            id: member.user?._id,
            name: member.user?.name,
            role: member.role,
            team: team.name,
          });
        }
      });
    });
    return allMembers;
  };

  const myReviews = reviews.filter(r => r.reviewer?._id === user?._id || r.reviewer === user?._id);
  const receivedReviews = reviews.filter(r => r.reviewee?._id === user?._id || r.reviewee === user?._id);

  if (loading) return <LoadingSpinner text="Loading peer reviews…" />;

  const isProfessor = user?.role === 'professor';
  const members = getTeamMembers();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to={isProfessor ? `/professor/projects/${projectId}` : `/student/projects/${projectId}`} className="hover:text-blue-600">
            {isProfessor ? 'Projects' : 'My Projects'}
          </Link>
          <span>/</span>
          <span>Peer Reviews</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Peer Review</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Provide anonymous feedback to your teammates and receive feedback from them
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{myReviews.length}</div>
          <div className="text-sm text-gray-500">Given</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{receivedReviews.length}</div>
          <div className="text-sm text-gray-500">Received</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">
            {receivedReviews.length > 0 
              ? (receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length).toFixed(1)
              : '-'}
          </div>
          <div className="text-sm text-gray-500">Avg Rating</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{members.length}</div>
          <div className="text-sm text-gray-500">Teammates</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('my-reviews')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'my-reviews'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          My Reviews Given
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Reviews Received
        </button>
        <button
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'write'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Write Review
        </button>
      </div>

      {/* Write Review Form */}
      {activeTab === 'write' && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Write Anonymous Review</h3>
          
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No teammates to review yet.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="label">Select Teammate</label>
                <select
                  className="input-field"
                  value={newReview.revieweeId}
                  onChange={(e) => setNewReview({ ...newReview, revieweeId: e.target.value })}
                  required
                >
                  <option value="">Select a teammate...</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role} - {member.team})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-gray-500 self-center">{newReview.rating}/5</span>
                </div>
              </div>
              
              <div>
                <label className="label">What did they do well?</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Their strengths and positive contributions..."
                  value={newReview.strengths}
                  onChange={(e) => setNewReview({ ...newReview, strengths: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="label">What could they improve?</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Areas for improvement (constructive feedback)..."
                  value={newReview.improvements}
                  onChange={(e) => setNewReview({ ...newReview, improvements: e.target.value })}
                />
              </div>
              
              <div>
                <label className="label">Additional Comments (optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Any other feedback..."
                  value={newReview.comments}
                  onChange={(e) => setNewReview({ ...newReview, comments: e.target.value })}
                />
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your review will be submitted anonymously. The recipient will see your feedback but won't know who provided it.
                </p>
              </div>
              
              <button 
                type="submit" 
                className="btn-primary flex items-center gap-2"
                disabled={submitting}
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* My Reviews Given */}
      {activeTab === 'my-reviews' && (
        <div className="space-y-4">
          {myReviews.length === 0 ? (
            <div className="card text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">No reviews given yet</h3>
              <p className="text-gray-400 text-sm mt-1">Write your first peer review!</p>
              <button
                onClick={() => setActiveTab('write')}
                className="btn-primary mt-4"
              >
                Write a Review
              </button>
            </div>
          ) : (
            myReviews.map(review => (
              <div key={review._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Review for {review.reviewee?.name || 'Teammate'}
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-600">Strengths:</span>
                    <p className="text-gray-600 dark:text-gray-400">{review.strengths}</p>
                  </div>
                  {review.improvements && (
                    <div>
                      <span className="font-medium text-blue-600">Areas for improvement:</span>
                      <p className="text-gray-600 dark:text-gray-400">{review.improvements}</p>
                    </div>
                  )}
                  {review.comments && (
                    <div>
                      <span className="font-medium text-gray-600">Comments:</span>
                      <p className="text-gray-600 dark:text-gray-400">{review.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reviews Received */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedReviews.length === 0 ? (
            <div className="card text-center py-12">
              <ThumbsUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">No reviews received yet</h3>
              <p className="text-gray-400 text-sm mt-1">Complete peer reviews to receive feedback from teammates.</p>
            </div>
          ) : (
            receivedReviews.map((review, idx) => (
              <div key={review._id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Anonymous Feedback</div>
                      <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-medium text-green-700 dark:text-green-400">Strengths:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{review.strengths}</p>
                  </div>
                  {review.improvements && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="font-medium text-blue-700 dark:text-blue-400">Areas for improvement:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{review.improvements}</p>
                    </div>
                  )}
                  {review.comments && (
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Additional Comments:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{review.comments}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3" />
                    This feedback was submitted anonymously
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PeerReviewPage;
