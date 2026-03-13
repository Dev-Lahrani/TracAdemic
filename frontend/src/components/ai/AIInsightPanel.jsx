import React from 'react';
import { riskColor } from '../../utils/helpers';
import { AlertTriangle, CheckCircle, TrendingUp, Users, Clock } from 'lucide-react';

const RiskBadge = ({ level }) => {
  const displayLevel = level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown';
  return (
    <span className={riskColor(level)}>
      {displayLevel} Risk
    </span>
  );
};

const AIInsightPanel = ({ insight }) => {
  if (!insight) {
    return (
      <div className="card text-center text-gray-400 py-12">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-gray-500">No AI insights yet</p>
        <p className="text-sm mt-1">Generate a summary from the week's updates.</p>
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Week {insight.weekNumber} Summary
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Generated {new Date(insight.createdAt).toLocaleString()}
          </p>
        </div>
        <RiskBadge level={insight.riskLevel} />
      </div>

      {/* Risk alert banner for critical/high */}
      {(insight.riskLevel === 'critical' || insight.riskLevel === 'high') && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          insight.riskLevel === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
        }`}>
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${insight.riskLevel === 'critical' ? 'text-red-600' : 'text-orange-500'}`} />
          <p className={`text-sm font-medium ${insight.riskLevel === 'critical' ? 'text-red-700' : 'text-orange-700'}`}>
            {insight.riskLevel === 'critical' ? 'Critical: Immediate attention required' : 'High risk: Team needs support'}
          </p>
        </div>
      )}

      {/* Summary text */}
      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
        <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
      </div>

      {/* Risk factors */}
      {insight.riskFactors?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Risk Factors
          </h4>
          <ul className="space-y-1">
            {insight.riskFactors.map((factor, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {insight.recommendations?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Recommendations
          </h4>
          <ul className="space-y-1">
            {insight.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contribution breakdown */}
      {insight.contributionBreakdown?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
            <Users className="w-4 h-4 text-blue-500" />
            Member Contributions
          </h4>
          <div className="space-y-2">
            {insight.contributionBreakdown.map((member, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                  {(member.studentName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">{member.studentName}</span>
                    <span className="text-xs text-gray-500 ml-2">{member.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${member.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details stats */}
      {insight.details && (
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-900">{insight.details.updateCount || 0}</div>
            <div className="text-xs text-gray-500">Updates</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-900">{insight.details.totalHours || 0}</div>
            <div className="text-xs text-gray-500">Total Hours</div>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-gray-900">{insight.details.activeBlockers || 0}</div>
            <div className="text-xs text-gray-500">Blockers</div>
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Generated by {insight.generatedBy === 'llm' ? 'AI Language Model' : 'Rule-based analyzer'}</span>
      </div>
    </div>
  );
};

export default AIInsightPanel;
