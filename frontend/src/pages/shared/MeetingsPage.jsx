import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Calendar, Plus, Video, MapPin, Clock, User, CheckCircle, 
  XCircle, ChevronRight, CalendarDays, Edit, Trash2
} from 'lucide-react';
import { formatDate, formatTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MeetingsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('upcoming');
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 60,
    meetingLink: '',
    location: '',
  });

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  const fetchMeetings = async () => {
    try {
      const res = await api.get(`/doubts/meetings/project/${projectId}`);
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doubts/meetings', {
        ...newMeeting,
        project: projectId,
      });
      toast.success('Meeting scheduled successfully');
      setShowForm(false);
      setNewMeeting({
        title: '',
        description: '',
        scheduledAt: '',
        durationMinutes: 60,
        meetingLink: '',
        location: '',
      });
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule meeting');
    }
  };

  const handleUpdateMeeting = async (meetingId, status) => {
    try {
      await api.put(`/doubts/meetings/${meetingId}`, { status });
      toast.success(`Meeting ${status}`);
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to update meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await api.put(`/doubts/meetings/${meetingId}`, { status: 'cancelled' });
      toast.success('Meeting cancelled');
      fetchMeetings();
    } catch (err) {
      toast.error('Failed to cancel meeting');
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const now = new Date();
    const meetingDate = new Date(meeting.scheduledAt);
    const isUpcoming = meetingDate > now;
    const isPast = meetingDate <= now;
    const isCancelled = meeting.status === 'cancelled';
    const isCompleted = meeting.status === 'completed';
    
    if (filter === 'upcoming') return isUpcoming && !isCancelled;
    if (filter === 'past') return isPast && !isCancelled;
    if (filter === 'cancelled') return isCancelled;
    if (filter === 'completed') return isCompleted;
    return true;
  });

  const upcomingCount = meetings.filter(m => new Date(m.scheduledAt) > new Date() && m.status !== 'cancelled').length;
  const pastCount = meetings.filter(m => new Date(m.scheduledAt) <= new Date() && m.status !== 'cancelled').length;

  if (loading) return <LoadingSpinner text="Loading meetings…" />;

  const isProfessor = user?.role === 'professor';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to={isProfessor ? `/professor/projects/${projectId}` : `/student/projects/${projectId}`} className="hover:text-blue-600">
              {isProfessor ? 'Projects' : 'My Projects'}
            </Link>
            <span>/</span>
            <span>Meetings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project Meetings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Schedule and manage team meetings
          </p>
        </div>
        
        {isProfessor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {/* Meeting Form */}
      {showForm && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Schedule New Meeting</h3>
          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div>
              <label className="label">Meeting Title</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Weekly Progress Review"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Meeting agenda..."
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={newMeeting.scheduledAt}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduledAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <select
                  className="input-field"
                  value={newMeeting.durationMinutes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, durationMinutes: parseInt(e.target.value) })}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="label">Meeting Link</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://zoom.us/j/..."
                  value={newMeeting.meetingLink}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingLink: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Location (optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Room 301 or Online"
                value={newMeeting.location}
                onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Schedule Meeting</button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingCount}</div>
            <div className="text-sm text-gray-500">Upcoming</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pastCount}</div>
            <div className="text-sm text-gray-500">Past Meetings</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['upcoming', 'past', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">No meetings found</h3>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'upcoming' ? 'No upcoming meetings scheduled.' : 'No meetings in this category.'}
          </p>
          {isProfessor && filter === 'upcoming' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4"
            >
              Schedule a Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => {
            const meetingDate = new Date(meeting.scheduledAt);
            const isUpcoming = meetingDate > new Date();
            const isCancelled = meeting.status === 'cancelled';
            const isCompleted = meeting.status === 'completed';
            
            return (
              <div 
                key={meeting._id} 
                className={`card hover:shadow-md transition-shadow ${
                  isCancelled ? 'opacity-60' : ''
                } ${selectedMeeting === meeting._id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div 
                  className="flex flex-col md:flex-row md:items-center gap-4 cursor-pointer"
                  onClick={() => setSelectedMeeting(selectedMeeting === meeting._id ? null : meeting._id)}
                >
                  {/* Date Box */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">
                        {meetingDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {meetingDate.getDate()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{meeting.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(meeting.scheduledAt)} - {meeting.durationMinutes} min
                          </span>
                          {meeting.meetingLink && (
                            <a
                              href={meeting.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </a>
                          )}
                          {meeting.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {meeting.location}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isUpcoming && !isCancelled && (
                          <span className="badge badge-green">Upcoming</span>
                        )}
                        {isCompleted && (
                          <span className="badge badge-blue">Completed</span>
                        )}
                        {isCancelled && (
                          <span className="badge badge-red">Cancelled</span>
                        )}
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedMeeting === meeting._id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedMeeting === meeting._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                    {meeting.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agenda:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{meeting.description}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <User className="w-4 h-4" />
                      <span>Scheduled by {meeting.scheduledBy?.name || 'Unknown'}</span>
                    </div>
                    
                    {/* Actions */}
                    {isProfessor && isUpcoming && !isCancelled && (
                      <div className="flex gap-2">
                        {meeting.meetingLink && (
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-sm"
                          >
                            <Video className="w-4 h-4 inline mr-1" />
                            Join Meeting
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateMeeting(meeting._id, 'completed');
                          }}
                          className="btn-secondary text-sm"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Mark Complete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeeting(meeting._id);
                          }}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {!isProfessor && isUpcoming && !isCancelled && meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm inline-flex"
                      >
                        <Video className="w-4 h-4 inline mr-1" />
                        Join Meeting
                      </a>
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

export default MeetingsPage;
