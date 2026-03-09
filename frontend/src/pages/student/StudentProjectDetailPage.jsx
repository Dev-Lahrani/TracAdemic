import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AIInsightPanel from '../../components/ai/AIInsightPanel';
import { formatDate, getCurrentWeek, getWeeksBetween, moodEmoji } from '../../utils/helpers';
import {
  FileText, Plus, Calendar, CheckCircle, Users,
  AlertTriangle, TrendingUp,
} from 'lucide-react';

const StudentProjectDetailPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [myUpdates, setMyUpdates] = useState([]);
  const [teamUpdates, setTeamUpdates] = useState([]);
  const [latestInsight, setLatestInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, myUpdatesRes, insightRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/updates/my/${projectId}`),
          api.get(`/ai/insights/${projectId}/latest`).catch(() => ({ data: { insight: null } })),
        ]);
        setProject(projRes.data.project);
        setMyUpdates(myUpdatesRes.data.updates);
        setLatestInsight(insightRes.data.insight);

        // Get team updates for the current week
        const week = getCurrentWeek(projRes.data.project.startDate);
        const teamRes = await api.get(`/updates/project/${projectId}?weekNumber=${week}`);
        setTeamUpdates(teamRes.data.updates);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  if (loading) return <LoadingSpinner text="Loading project…" />;
  if (!project) return <div className="card text-center py-12 text-gray-500">Project not found.</div>;

  const totalWeeks = getWeeksBetween(project.startDate, project.endDate);
  const currentWeek = getCurrentWeek(project.startDate);
  const progressPercent = Math.min(100, Math.round((currentWeek / totalWeeks) * 100));
  const hasSubmittedThisWeek = myUpdates.some((u) => u.weekNumber === currentWeek);

  const tabs = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'my-updates', label: `My Updates (${myUpdates.length})` },
    { id: 'team', label: 'Team' },
    { id: 'insights', label: 'AI Insights' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/student/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span>{project.title}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {project.course && <span className="badge-blue">{project.course}</span>}
              {project.semester && <span>{project.semester}</span>}
              <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
            </div>
          </div>

          {!hasSubmittedThisWeek && (
            <Link
              to={`/student/projects/${projectId}/submit`}
              className="btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Submit Week {currentWeek} Update
            </Link>
          )}
          {hasSubmittedThisWeek && (
            <span className="badge-green flex items-center gap-1.5 px-3 py-1.5 text-sm">
              <CheckCircle className="w-4 h-4" />
              Update submitted ✓
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Week {currentWeek} of {totalWeeks}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          {/* Milestones */}
          {project.milestones?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-500" />
                Project Milestones
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {project.milestones.map((m, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                        m.completed
                          ? 'bg-green-500 border-green-500'
                          : new Date(m.dueDate) < Date.now()
                          ? 'bg-red-400 border-red-400'
                          : 'bg-white border-blue-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${m.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                            {m.title}
                          </p>
                          <span className={`text-xs ${new Date(m.dueDate) < Date.now() && !m.completed ? 'text-red-500' : 'text-gray-400'}`}>
                            {formatDate(m.dueDate)}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* This week's team updates */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              This Week&apos;s Team Activity (Week {currentWeek})
            </h3>
            {teamUpdates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No updates submitted yet this week.</p>
            ) : (
              <div className="space-y-3">
                {teamUpdates.map((update) => (
                  <div key={update._id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                      {update.student?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{update.student?.name}</p>
                        <span className="text-lg">{moodEmoji(update.mood)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{update.individualContribution}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Updates tab */}
      {activeTab === 'my-updates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{myUpdates.length} update{myUpdates.length !== 1 ? 's' : ''} submitted</p>
            {!hasSubmittedThisWeek && (
              <Link to={`/student/projects/${projectId}/submit`} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Submit This Week
              </Link>
            )}
          </div>

          {myUpdates.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No updates submitted yet.</p>
            </div>
          ) : (
            myUpdates.map((update) => (
              <div key={update._id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge-blue">Week {update.weekNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{moodEmoji(update.mood)}</span>
                    <span className="badge-gray">{update.hoursWorked}h</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{update.individualContribution}</p>

                {update.completedTasks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Completed:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {update.completedTasks.map((t, i) => (
                        <span key={i} className="badge-green text-xs">{t.title}</span>
                      ))}
                    </div>
                  </div>
                )}

                {update.blockers?.filter((b) => !b.resolved).length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {update.blockers.filter((b) => !b.resolved).length} active blocker(s)
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-500" />
            Team Members
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.teams?.flatMap((t) =>
              t.members.map((m) => (
                <div key={m.user._id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    {m.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.user.name}</p>
                    <p className="text-xs text-gray-500">{m.role === 'leader' ? '👑 Team Leader' : 'Member'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* AI Insights tab */}
      {activeTab === 'insights' && (
        <AIInsightPanel insight={latestInsight} />
      )}
    </div>
  );
};

export default StudentProjectDetailPage;
