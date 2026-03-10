import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import { BookOpen, FileText, Plus, Clock, CheckSquare } from 'lucide-react';
import { formatDate, getCurrentWeek } from '../../utils/helpers';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects/student').then(({ data }) => {
      setProjects(data.projects);
    }).catch(() => {
      setError('Failed to load projects. Please try again.');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your projects…" />;
  if (error) return <div className="card text-center py-12 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Your academic project dashboard</p>
        </div>
        <Link to="/student/join" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Join Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Active Projects" value={projects.length} icon={BookOpen} color="blue" />
        <StatCard
          title="This Week's Deadline"
          value={projects.length > 0 ? 'Submit Update' : 'No Projects'}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Team Leader Of"
          value={projects.filter((p) => p.memberRole === 'leader').length}
          icon={CheckSquare}
          color="green"
        />
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Projects</h2>

        {projects.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-700">No projects yet</h3>
            <p className="text-gray-400 text-sm mt-1">
              Ask your professor for an invite code and join a project.
            </p>
            <Link to="/student/join" className="btn-primary mt-6 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Join Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const currentWeek = project.startDate ? getCurrentWeek(project.startDate) : 1;
              return (
                <div key={project._id} className="card hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`badge ${project.memberRole === 'leader' ? 'badge-purple' : 'badge-gray'}`}>
                        {project.memberRole === 'leader' ? '👑 Leader' : 'Member'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>

                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    {project.course && <span className="badge-blue">{project.course}</span>}
                    <span>Week {currentWeek}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/student/projects/${project._id}`}
                      className="btn-secondary text-sm flex-1 text-center"
                    >
                      View Project
                    </Link>
                    <Link
                      to={`/student/projects/${project._id}/submit`}
                      className="btn-primary text-sm flex items-center gap-1 px-3"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Submit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
