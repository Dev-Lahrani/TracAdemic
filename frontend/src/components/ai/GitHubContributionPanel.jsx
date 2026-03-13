import React, { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Star, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const AuthScoreGrade = ({ grade, score }) => {
  const gradeStyles = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-orange-100 text-orange-800 border-orange-200',
    suspicious: 'bg-red-100 text-red-800 border-red-200',
    insufficient_data: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${gradeStyles[grade] || gradeStyles.insufficient_data}`}>
      {grade === 'high' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {score}/100 – {grade?.replace('_', ' ')}
    </div>
  );
};

const GitHubContributionPanel = ({ studentId, studentName, projectId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');

  const analyze = async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (username) params.set('username', username);
      if (projectId) params.set('projectId', projectId);
      const { data: res } = await api.get(`/github/contribution/${studentId}?${params}`);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const weeklyActivityData = data?.githubData?.weeklyActivity?.map(w => ({
    week: `W${w.week}`,
    commits: w.commits,
    prs: w.prs,
  })) || [];

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">GitHub Contribution Verification</h3>
          <p className="text-xs text-gray-500">{studentName}</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="GitHub username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button onClick={analyze} disabled={loading} className="btn-primary whitespace-nowrap">
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Authenticity Score</span>
            <AuthScoreGrade grade={data.authenticityScore?.grade} score={data.authenticityScore?.score} />
          </div>

          {data.githubError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
              ⚠️ {data.githubError}
            </div>
          )}

          {/* GitHub Profile */}
          {data.githubData?.profile && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {data.githubData.profile.avatarUrl && (
                  <img src={data.githubData.profile.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <div className="font-medium text-sm">{data.githubData.profile.name || data.githubData.profile.login}</div>
                  <a
                    href={`https://github.com/${data.githubData.profile.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    @{data.githubData.profile.login} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-gray-900 flex items-center justify-center gap-1">
                    <GitCommit className="w-3 h-3 text-blue-500" />
                    {data.githubData.metrics.totalCommits}
                  </div>
                  <div className="text-gray-500">Commits</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-gray-900 flex items-center justify-center gap-1">
                    <GitPullRequest className="w-3 h-3 text-green-500" />
                    {data.githubData.metrics.pullRequests}
                  </div>
                  <div className="text-gray-500">PRs</div>
                </div>
                <div className="bg-white rounded p-2 border">
                  <div className="font-bold text-gray-900 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {data.githubData.metrics.reviewActivity}
                  </div>
                  <div className="text-gray-500">Reviews</div>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Activity Chart */}
          {weeklyActivityData.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">12-Week Activity</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weeklyActivityData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="commits" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score Factors */}
          {data.authenticityScore?.factors?.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Score Factors</h4>
              <ul className="space-y-1">
                {data.authenticityScore.factors.map((f, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className={f.toLowerCase().includes('warn') || f.toLowerCase().includes('no commit') ? 'text-orange-400' : 'text-green-400'}>
                      {f.toLowerCase().includes('warn') || f.toLowerCase().includes('no commit') ? '⚠' : '✓'}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400 italic">{data.analysisNote}</p>
        </div>
      )}
    </div>
  );
};

export default GitHubContributionPanel;
