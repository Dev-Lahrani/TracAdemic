import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Code2, GitBranch, Bug, AlertTriangle, CheckCircle, 
  Lightbulb, FileCode, Copy, Download, RefreshCw,
  Shield, Zap, BarChart3, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const CodeReviewPage = () => {
  const { projectId } = useParams();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('code');

  const sampleCode = `// Sample code for review
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

async function fetchData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  const result = await db.query(query);
  return result;
}`;

  const handleReview = async () => {
    if (!code.trim()) {
      toast.error('Please enter code to review');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/code-review/review', { code, language });
      setReview(res.data.review);
      toast.success('Code reviewed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review code');
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setCode(sampleCode);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Code2 className="w-7 h-7 text-purple-600" />
          AI Code Review Assistant
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Get instant code analysis, security checks, and improvement suggestions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Code Input</h2>
            <div className="flex gap-2">
              <select
                className="input-field w-auto text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
              </select>
              <button onClick={loadSample} className="btn-secondary text-sm">
                Load Sample
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="input-field font-mono text-sm min-h-[400px] resize-none"
              placeholder="Paste your code here for review..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                title="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
              {code && (
                <button
                  onClick={() => setCode('')}
                  className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 rounded hover:bg-red-200"
                  title="Clear"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleReview}
            disabled={loading || !code.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Code2 className="w-4 h-4" />
                Review Code
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Analysis Results</h2>

          {loading && <LoadingSpinner text="Analyzing code..." />}

          {review && !loading && (
            <div className="space-y-4 animate-fade-in">
              {/* Score Card */}
              <div className="card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Code Quality Score</div>
                    <div className={`text-3xl font-bold ${
                      review.score >= 80 ? 'text-green-600' :
                      review.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {review.score}/100
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{review.securityIssues.length}</div>
                      <div className="text-xs text-gray-500">Security</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{review.codeQualityIssues.length}</div>
                      <div className="text-xs text-gray-500">Quality</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{review.suggestions.length}</div>
                      <div className="text-xs text-gray-500">Tips</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {['issues', 'suggestions', 'complexity'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 text-sm font-medium capitalize ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {tab === 'issues' ? `Issues (${review.securityIssues.length + review.codeQualityIssues.length})` : 
                     tab === 'suggestions' ? `Suggestions (${review.suggestions.length})` : 'Complexity'}
                  </button>
                ))}
              </div>

              {/* Issues Tab */}
              {activeTab === 'issues' && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {review.securityIssues.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Security Issues
                      </h3>
                      {review.securityIssues.map((issue, i) => (
                        <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-red capitalize">{issue.severity}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">{issue.message}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Line {issue.line}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.codeQualityIssues.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-yellow-600 flex items-center gap-1">
                        <Bug className="w-4 h-4" /> Quality Issues
                      </h3>
                      {review.codeQualityIssues.map((issue, i) => (
                        <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{issue.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Line {issue.line} - {issue.snippet}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.securityIssues.length === 0 && review.codeQualityIssues.length === 0 && (
                    <div className="text-center py-6 text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p>No issues found!</p>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {review.suggestions.map((suggestion, i) => (
                    <div key={i} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Lightbulb className="w-4 h-4 text-blue-500" />
                        {suggestion.message}
                      </div>
                      {suggestion.line && (
                        <div className="text-xs text-gray-500 mt-1">Line {suggestion.line}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Complexity Tab */}
              {activeTab === 'complexity' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-purple-600">{review.complexity.score}</div>
                    <div>
                      <div className="font-medium">Cyclomatic Complexity</div>
                      <div className={`text-sm ${
                        review.complexity.rating === 'Low' ? 'text-green-600' :
                        review.complexity.rating === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {review.complexity.rating}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        review.complexity.rating === 'Low' ? 'bg-green-500' :
                        review.complexity.rating === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(review.complexity.score * 10, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Lower complexity is better. Aim for under 10 for maintainable code.
                  </p>
                </div>
              )}
            </div>
          )}

          {!review && !loading && (
            <div className="card text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
              <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-500 dark:text-gray-400">No Code Analyzed</h3>
              <p className="text-sm text-gray-400 mt-1">
                Paste your code and click "Review Code" to get analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeReviewPage;
