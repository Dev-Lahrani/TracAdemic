import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AIInsightPanel from '../../components/ai/AIInsightPanel';
import StatCard from '../../components/common/StatCard';
import { formatDate, getCurrentWeek, getWeeksBetween, moodEmoji } from '../../utils/helpers';
import {
  Users, FileText, TrendingUp, AlertTriangle,
  RefreshCw, Calendar, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [teams, setTeams] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [latestInsight, setLatestInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, teamsRes, updatesRes, insightRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/teams/project/${id}`),
          api.get(`/updates/project/${id}`),
          api.get(`/ai/insights/${id}/latest`).catch(() => ({ data: { insight: null } })),
        ]);
        setProject(projRes.data.project);
        setTeams(teamsRes.data.teams);
        setUpdates(updatesRes.data.updates);
        setLatestInsight(insightRes.data.insight);

        if (projRes.data.project?.startDate) {
          setSelectedWeek(getCurrentWeek(projRes.data.project.startDate));
        }
      } catch (err) {
        toast.error('Failed to load project data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const generateSummary = async () => {
    setGeneratingInsight(true);
    try {
      const { data } = await api.post('/ai/summary', {
        projectId: id,
        weekNumber: selectedWeek,
        teamId: selectedTeam || undefined,
      });
      setLatestInsight(data.insight);
      toast.success('AI summary generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate summary.');
    } finally {
      setGeneratingInsight(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading project…" />;
  if (!project) return <div className="card text-center py-12 text-gray-500">Project not found.</div>;

  const totalWeeks = getWeeksBetween(project.startDate, project.endDate);
  const currentWeek = getCurrentWeek(project.startDate);
  const weeklyData = Array.from({ length: Math.min(currentWeek, totalWeeks) }, (_, i) => {
    const week = i + 1;
    const weekUpdates = updates.filter((u) => u.weekNumber === week);
    return {
      week: `W${week}`,
      updates: weekUpdates.length,
      hours: weekUpdates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0),
      blockers: weekUpdates.reduce((sum, u) => sum + (u.blockers || []).filter((b) => !b.resolved).length, 0),
    };
  });

  const totalStudents = teams.reduce((sum, t) => sum + t.members.length, 0);
  const currentWeekUpdates = updates.filter((u) => u.weekNumber === currentWeek);
  const submissionRate = totalStudents > 0
    ? Math.round((currentWeekUpdates.length / totalStudents) * 100) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'teams', label: `Teams (${teams.length})` },
    { id: 'updates', label: `Updates (${updates.length})` },
    { id: 'insights', label: 'AI Insights' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link to="/professor/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <span>/</span>
              <span>{project.title}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              {project.course && <span className="badge-blue">{project.course}</span>}
              {project.semester && <span>{project.semester}</span>}
              <span>{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Invite code:</span>
            <code className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-lg font-mono font-bold text-sm">
              {project.inviteCode}
            </code>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Teams" value={teams.length} icon={Users} color="blue" />
        <StatCard title="Students" value={totalStudents} icon={Users} color="purple" />
        <StatCard title="This Week Updates" value={`${currentWeekUpdates.length}/${totalStudents}`} icon={FileText} color="green" />
        <StatCard title="Submission Rate" value={`${submissionRate}%`} icon={TrendingUp} color={submissionRate < 50 ? 'red' : 'green'} />
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

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Weekly activity chart */}
          {weeklyData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Weekly Update Activity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="updates" fill="#3b82f6" name="Updates" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="blockers" fill="#f87171" name="Blockers" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Milestones */}
          {project.milestones?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Milestones
              </h3>
              <div className="space-y-3">
                {project.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      m.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${m.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {m.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Due: {formatDate(m.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-4">
          {teams.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No teams have joined yet. Share the invite code: <strong>{project.inviteCode}</strong></p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team._id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <span className="badge-blue">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {team.members.map((member) => {
                    const userData = typeof member.user === 'object' && member.user ? member.user : { _id: member.user || member._id, name: 'Unknown' };
                    return (
                      <div key={userData._id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                          {(userData.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{userData.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{member.role === 'leader' ? '👑 Leader' : 'Member'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="space-y-3">
          {updates.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No updates submitted yet.</p>
            </div>
          ) : (
            updates.map((update) => (
              <div key={update._id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {(update.student?.name || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{update.student?.name}</p>
                      <p className="text-xs text-gray-500">{update.team?.name} · Week {update.weekNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{moodEmoji(update.mood)}</span>
                    <span className="badge-gray">{update.hoursWorked}h</span>
                    {(update.blockers || []).filter((b) => !b.resolved).length > 0 && (
                      <span className="badge-red flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {(update.blockers || []).filter((b) => !b.resolved).length} blocker(s)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  {update.individualContribution}
                </p>

                {update.completedTasks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Completed tasks:</p>
                    <div className="flex flex-wrap gap-2">
                      {update.completedTasks.map((task, i) => (
                        <span key={i} className="badge-green">{task.title}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Generate insight controls */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Generate AI Summary</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="label text-xs">Week Number</label>
                <select
                  className="input-field w-28"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                >
                  {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Team (optional)</label>
                <select
                  className="input-field w-40"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                >
                  <option value="">All teams</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={generateSummary}
                disabled={generatingInsight}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${generatingInsight ? 'animate-spin' : ''}`} />
                {generatingInsight ? 'Generating…' : 'Generate Summary'}
              </button>
            </div>
          </div>

          {/* Latest insight */}
          <AIInsightPanel insight={latestInsight} />
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
