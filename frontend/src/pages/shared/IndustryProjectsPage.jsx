import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Briefcase, Plus, Building, MapPin, Users, Clock, CheckCircle, 
  XCircle, ExternalLink, Search, Filter, DollarSign,
  ChevronRight, Star, Send
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const IndustryProjectsPage = () => {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newProject, setNewProject] = useState({
    title: '',
    company: '',
    description: '',
    requiredSkills: '',
    maxStudents: 3,
    duration: '',
    location: '',
    stipend: '',
    deadline: '',
    applicationLink: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const [projectsRes, appsRes] = await Promise.all([
        api.get('/industry'),
        user?.role === 'student' ? api.get('/industry/my-applications').catch(() => ({ data: { applications: [] } })) : Promise.resolve({ data: { applications: [] } }),
      ]);
      setProjects(projectsRes.data.projects || []);
      setMyApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/industry', {
        ...newProject,
        requiredSkills: newProject.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
      });
      toast.success('Industry project created successfully');
      setShowForm(false);
      setNewProject({
        title: '',
        company: '',
        description: '',
        requiredSkills: '',
        maxStudents: 3,
        duration: '',
        location: '',
        stipend: '',
        deadline: '',
        applicationLink: '',
      });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleApply = async (projectId) => {
    try {
      await api.post(`/industry/${projectId}/apply`);
      toast.success('Application submitted successfully');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || 
      (filter === 'open' && project.status === 'open') ||
      (filter === 'closed' && project.status === 'closed');
    const matchesSearch = project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getApplicationStatus = (projectId) => {
    const app = myApplications.find(a => a.project?._id === projectId || a.project === projectId);
    return app?.status;
  };

  if (loading) return <LoadingSpinner text="Loading industry projects…" />;

  const isProfessor = user?.role === 'professor';
  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Industry Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isStudent ? 'Browse and apply to real-world industry projects' : 'Post industry projects for students'}
          </p>
        </div>
        
        {isProfessor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Project
          </button>
        )}
      </div>

      {/* Tabs */}
      {isStudent && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Browse Projects
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            My Applications ({myApplications.length})
          </button>
        </div>
      )}

      {/* Project Form */}
      {showForm && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Post New Industry Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Project Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., E-commerce Platform Development"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Tech Corp Inc."
                  value={newProject.company}
                  onChange={(e) => setNewProject({ ...newProject, company: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Describe the project, objectives, and deliverables..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="label">Required Skills (comma-separated)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., React, Node.js, MongoDB"
                value={newProject.requiredSkills}
                onChange={(e) => setNewProject({ ...newProject, requiredSkills: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">Max Students</label>
                <input
                  type="number"
                  className="input-field"
                  min="1"
                  max="10"
                  value={newProject.maxStudents}
                  onChange={(e) => setNewProject({ ...newProject, maxStudents: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Duration</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., 3 months"
                  value={newProject.duration}
                  onChange={(e) => setNewProject({ ...newProject, duration: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Remote / City"
                  value={newProject.location}
                  onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Stipend</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="$500/month"
                  value={newProject.stipend}
                  onChange={(e) => setNewProject({ ...newProject, stipend: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Application Deadline</label>
                <input
                  type="date"
                  className="input-field"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Application Link</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://company.com/careers/..."
                  value={newProject.applicationLink}
                  onChange={(e) => setNewProject({ ...newProject, applicationLink: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Post Project</button>
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
      {activeTab === 'browse' && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'closed'].map((f) => (
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
      )}

      {/* My Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="card text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">No applications yet</h3>
              <p className="text-gray-400 text-sm mt-1">Browse projects and apply to get started.</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="btn-primary mt-4"
              >
                Browse Projects
              </button>
            </div>
          ) : (
            myApplications.map((app) => (
              <div key={app._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{app.project?.title || 'Project'}</h3>
                      <p className="text-sm text-gray-500">{app.project?.company}</p>
                    </div>
                  </div>
                  <div>
                    {app.status === 'pending' && <span className="badge badge-yellow">Pending</span>}
                    {app.status === 'accepted' && <span className="badge badge-green">Accepted</span>}
                    {app.status === 'rejected' && <span className="badge badge-red">Rejected</span>}
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Applied on {formatDate(app.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Projects Grid */}
      {activeTab === 'browse' && (
        <>
          {filteredProjects.length === 0 ? (
            <div className="card text-center py-12">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">No projects found</h3>
              <p className="text-gray-400 text-sm mt-1">
                {filter !== 'all' ? 'Try changing the filter.' : 'No industry projects available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const appStatus = getApplicationStatus(project._id);
                const isClosed = project.status === 'closed' || (project.deadline && new Date(project.deadline) < new Date());
                
                return (
                  <div key={project._id} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{project.title}</h3>
                          <p className="text-sm text-gray-500">{project.company}</p>
                        </div>
                      </div>
                      {isClosed ? (
                        <span className="badge badge-gray">Closed</span>
                      ) : (
                        <span className="badge badge-green">Open</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.requiredSkills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="badge badge-blue">{skill}</span>
                      ))}
                    </div>
                    
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
                      {project.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {project.location}
                        </span>
                      )}
                      {project.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {project.duration}
                        </span>
                      )}
                      {project.stipend && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {project.stipend}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.currentStudents || 0}/{project.maxStudents} students
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedProject(selectedProject === project._id ? null : project._id)}
                        className="btn-secondary text-sm flex-1"
                      >
                        View Details
                      </button>
                      {isStudent && !isClosed && !appStatus && (
                        <button
                          onClick={() => handleApply(project._id)}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          <Send className="w-4 h-4" />
                          Apply
                        </button>
                      )}
                      {isStudent && appStatus === 'pending' && (
                        <span className="badge badge-yellow py-2">Application Pending</span>
                      )}
                      {isStudent && appStatus === 'accepted' && (
                        <span className="badge badge-green py-2">Accepted!</span>
                      )}
                    </div>
                    
                    {/* Expanded Details */}
                    {selectedProject === project._id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Full Description:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                        
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.requiredSkills?.map((skill, idx) => (
                            <span key={idx} className="badge badge-purple">{skill}</span>
                          ))}
                        </div>
                        
                        {project.deadline && (
                          <p className="text-sm text-gray-500">
                            Application Deadline: {formatDate(project.deadline)}
                          </p>
                        )}
                        
                        {project.applicationLink && (
                          <a
                            href={project.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm mt-4 inline-flex items-center gap-1"
                          >
                            Apply via Company Site
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndustryProjectsPage;
