import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, AlertTriangle, Shield, BarChart3, Users, TrendingUp } from 'lucide-react';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AIInsightPanel from '../../components/ai/AIInsightPanel';
import { riskColor } from '../../utils/helpers';

const ProjectAnalyticsPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [latestInsight, setLatestInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: projData } = await api.get(`/projects/${id}`);
        setProject(projData.project);

        const [riskRes, integrityRes, insightRes] = await Promise.allSettled([
          api.get(`/ai/risk/${id}`),
          api.get(`/ai/integrity/${id}`),
          api.get(`/ai/insights/${id}/latest`),
        ]);

        if (riskRes.status === 'fulfilled') setRiskData(riskRes.value.data);
        if (integrityRes.status === 'fulfilled') setIntegrityData(integrityRes.value.data);
        if (insightRes.status === 'fulfilled') setLatestInsight(insightRes.value.data.insight);

        if (projData.project.teams?.length > 0) {
          const teamId = projData.project.teams[0]._id;
          const { data: analyticsData } = await api.get(`/teams/${teamId}/analytics`);
          setAnalytics(analyticsData.analytics);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading analytics…" />;
  if (error) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="card text-red-600">{error}</div></div>;
  if (!project) return null;

  const contributionChartData = analytics?.memberStats?.map(m => ({
    name: m.student?.name?.split(' ')[0] || 'Unknown',
    contribution: Math.round(m.avgContribution || 0),
    hours: m.totalHours || 0,
  })) || [];

  const weeklyTrendData = analytics?.weeklyTrend?.map(w => ({
    week: `Wk ${w.week}`,
    updates: w.updateCount,
    hours: w.totalHours,
    blockers: w.blockers,
  })) || [];

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return 'text-red-700 bg-red-50 border-red-200';
    if (severity === 'high') return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/professor/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
            {riskData && (
              <span className={riskColor(riskData.riskLevel)}>
                {riskData.riskLevel?.charAt(0).toUpperCase() + riskData.riskLevel?.slice(1)} Risk
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{project.course} · {project.semester}</p>
        </div>
      </div>

      {/* Risk Signals */}
      {riskData && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className={`w-5 h-5 ${riskData.riskLevel === 'low' ? 'text-green-500' : 'text-orange-500'}`} />
            <h2 className="font-semibold text-gray-900">Risk Assessment</h2>
            <span className={`ml-auto ${riskColor(riskData.riskLevel)}`}>
              {riskData.riskLevel?.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{riskData.signals?.totalStudents || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Total Students</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{riskData.signals?.activeStudentsThisWeek || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Active This Week</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{riskData.signals?.inactiveMembers || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Inactive Members</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(riskData.signals?.participationRate || 0)}%</div>
              <div className="text-xs text-gray-500 mt-1">Participation Rate</div>
            </div>
          </div>
          {riskData.riskFactors?.length > 0 && (
            <ul className="space-y-1">
              {riskData.riskFactors.map((f, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">•</span>{f}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {contributionChartData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Member Contributions
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contributionChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="contribution" name="Contribution %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" name="Hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {weeklyTrendData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Weekly Activity Trend
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weeklyTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" name="Hours" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="updates" name="Updates" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="blockers" name="Blockers" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Integrity Analysis */}
      {integrityData && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900">Academic Integrity Analysis</h2>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{integrityData.integrityScore}/100</span>
              <span className={`badge ${
                integrityData.integrityLevel === 'clean' ? 'badge-green' :
                integrityData.integrityLevel === 'minor_concerns' ? 'badge-yellow' :
                integrityData.integrityLevel === 'suspicious' ? 'badge-red' : 'badge bg-red-200 text-red-900'
              }`}>
                {integrityData.integrityLevel?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">{integrityData.summary}</p>
          {integrityData.flags?.length > 0 && (
            <div className="space-y-2">
              {integrityData.flags.map((flag, i) => (
                <div key={i} className={`p-3 rounded-lg border text-sm ${getSeverityColor(flag.severity)}`}>
                  <div className="font-medium capitalize">{flag.type.replace(/_/g, ' ')}</div>
                  <div className="mt-0.5 opacity-80">{flag.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Latest AI Insight */}
      {latestInsight && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Latest AI Insight
          </h2>
          <AIInsightPanel insight={latestInsight} />
        </div>
      )}

      {/* Member stats */}
      {analytics?.memberStats?.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Team Member Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.memberStats.map((member, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    {(member.student?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{member.student?.name || 'Unknown'}</div>
                    <span className={`badge ${member.role === 'leader' ? 'badge-purple' : 'badge-gray'} text-xs`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="font-bold text-blue-700 text-lg">{member.totalHours || 0}</div>
                    <div className="text-gray-500">Total Hours</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="font-bold text-green-700 text-lg">{member.totalUpdates || 0}</div>
                    <div className="text-gray-500">Updates</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2">
                    <div className="font-bold text-purple-700 text-lg">{Math.round(member.avgContribution || 0)}%</div>
                    <div className="text-gray-500">Avg. Contrib</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectAnalyticsPage;
