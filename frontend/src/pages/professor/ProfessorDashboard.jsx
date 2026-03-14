import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import StatCard from '../../components/common/StatCard';
import { DashboardSkeleton } from '../../components/common/Skeleton';
import { BookOpen, Users, FileText, Plus, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects').then(({ data }) => {
      setProjects(data.projects);
    }).catch(() => {
      setError('Failed to load projects. Please try again.');
    }).finally(() => setLoading(false));
  }, []);

  const totalStudents = projects.reduce((sum, p) => sum + (p.studentCount || 0), 0);
  const totalUpdates = projects.reduce((sum, p) => sum + (p.updateCount || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active').length;

  if (loading) return <DashboardSkeleton />;
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="card text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Failed to load projects</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s an overview of your projects</p>
        </div>
        <Link to="/professor/projects/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Projects" value={projects.length} icon={BookOpen} color="blue" />
        <StatCard title="Active Projects" value={activeProjects} icon={TrendingUp} color="green" />
        <StatCard title="Total Students" value={totalStudents} icon={Users} color="purple" />
        <StatCard title="Updates Received" value={totalUpdates} icon={FileText} color="yellow" />
      </div>

      {/* Projects list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h2>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700">No projects yet</h3>
            <p className="text-gray-400 text-sm mt-1">Create your first project to get started.</p>
            <Link to="/professor/projects/new" className="btn-primary mt-6 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/professor/projects/${project._id}`}
                className="card hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`badge ${
                    project.status === 'active' ? 'badge-green' :
                    project.status === 'at-risk' ? 'badge-red' : 'badge-gray'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {project.studentCount || 0} students
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {project.updateCount || 0} updates
                  </span>
                  <span className="ml-auto">{project.course}</span>
                </div>

                {project.inviteCode && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400">Invite code:</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-gray-700">
                      {project.inviteCode}
                    </code>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/professor/projects/${project._id}/analytics`}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    View Analytics
                  </Link>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessorDashboard;
