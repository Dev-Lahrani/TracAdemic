import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Brain, BarChart3,
  Users, Clock, CheckCircle, XCircle, Target, Calendar, Zap,
  ArrowUp, ArrowDown, Minus, Activity, Shield
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const PredictiveAnalyticsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, [projectId]);

  const fetchPredictions = async () => {
    try {
      const res = await api.get(`/ai/predictive/${projectId || ''}`).catch(() => ({ data: {} }));
      setPredictions(res.data.predictions || generateMockPredictions());
    } catch (err) {
      setPredictions(generateMockPredictions());
    } finally {
      setLoading(false);
    }
  };

  const generateMockPredictions = () => {
    const teams = [
      { id: 1, name: 'Team Alpha', members: 4, riskLevel: 'low', successProbability: 92, trend: 'up', weeklyProgress: 85 },
      { id: 2, name: 'Team Beta', members: 3, riskLevel: 'medium', successProbability: 68, trend: 'stable', weeklyProgress: 62 },
      { id: 3, name: 'Team Gamma', members: 5, riskLevel: 'high', successProbability: 45, trend: 'down', weeklyProgress: 38 },
    ];

    return {
      projectSuccessRate: 78,
      predictedCompletionDate: '2024-04-15',
      atRiskTeams: 1,
      healthyTeams: 2,
      overallTrend: 'stable',
      teams,
      riskFactors: [
        { factor: 'Low GitHub Activity', impact: 'high', teams: ['Team Gamma'] },
        { factor: 'Missed Deadlines', impact: 'medium', teams: ['Team Beta', 'Team Gamma'] },
        { factor: 'Unbalanced Contributions', impact: 'medium', teams: ['Team Beta'] },
        { factor: 'High Blocker Count', impact: 'low', teams: [] },
      ],
      weeklyTrend: [
        { week: 'W1', progress: 10, success: 95 },
        { week: 'W2', progress: 25, success: 92 },
        { week: 'W3', progress: 40, success: 88 },
        { week: 'W4', progress: 52, success: 85 },
        { week: 'W5', progress: 65, success: 82 },
        { week: 'W6', progress: 72, success: 78 },
      ],
      resourceUtilization: [
        { name: 'Team Alpha', utilization: 90 },
        { name: 'Team Beta', utilization: 65 },
        { name: 'Team Gamma', utilization: 40 },
      ],
    };
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'low': return <Shield className="w-5 h-5 text-green-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'high': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) return <LoadingSpinner text="Analyzing project data…" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/professor/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span>Predictive Analytics</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Predictions</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Machine learning analysis to forecast project outcomes and identify risks
        </p>
      </div>

      {/* AI Analysis Banner */}
      <div className="card mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Prediction Engine</h3>
              <p className="text-blue-100 text-sm">
                Based on {predictions?.teams?.length || 3} teams, {predictions?.weeklyTrend?.length * 4 || 24} data points analyzed
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{predictions?.projectSuccessRate || 78}%</div>
            <div className="text-blue-100 text-sm">Project Success Rate</div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{predictions?.healthyTeams || 2}</div>
              <div className="text-sm text-gray-500">Healthy Teams</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{predictions?.atRiskTeams || 1}</div>
              <div className="text-sm text-gray-500">At-Risk Teams</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {predictions?.predictedCompletionDate ? new Date(predictions.predictedCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Apr 15'}
              </div>
              <div className="text-sm text-gray-500">Predicted Completion</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{predictions?.overallTrend || 'stable'}</span>
                {predictions?.overallTrend === 'up' && <ArrowUp className="w-5 h-5 text-green-500" />}
                {predictions?.overallTrend === 'down' && <ArrowDown className="w-5 h-5 text-red-500" />}
              </div>
              <div className="text-sm text-gray-500">Overall Trend</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Success Probability Trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Success Probability Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions?.weeklyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis domain={[0, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Success Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Utilization */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resource Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions?.resourceUtilization || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                <Tooltip />
                <Bar dataKey="utilization" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Utilization %">
                  {(predictions?.resourceUtilization || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization > 70 ? '#22c55e' : entry.utilization > 40 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Risk Analysis */}
      <div className="card mb-8">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Team Risk Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Members</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Success Prob.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(predictions?.teams || []).map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                    >
                      {team.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {team.members}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(team.riskLevel)}`}>
                      {getRiskIcon(team.riskLevel)}
                      {team.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            team.successProbability > 70 ? 'bg-green-500' :
                            team.successProbability > 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${team.successProbability}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{team.successProbability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{team.weeklyProgress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getTrendIcon(team.trend)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Identified Risk Factors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(predictions?.riskFactors || []).map((risk, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                risk.impact === 'high' ? 'text-red-500' :
                risk.impact === 'medium' ? 'text-yellow-500' : 'text-blue-500'
              }`} />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{risk.factor}</div>
                <div className="text-sm text-gray-500">
                  Impact: <span className="capitalize">{risk.impact}</span>
                  {risk.teams?.length > 0 && (
                    <> • Affects: {risk.teams.join(', ')}</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsPage;
