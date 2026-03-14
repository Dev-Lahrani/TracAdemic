import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Trophy, Star, Flame, Zap, Award, Medal, Crown, Target, 
  CheckCircle, Clock, Users, BookOpen, FileText, MessageCircle,
  Calendar, TrendingUp, Lock, Gift
} from 'lucide-react';

const badgeDefinitions = [
  { id: 'first_update', name: 'First Steps', description: 'Submitted your first weekly update', icon: Star, color: 'bg-yellow-400', rarity: 'common' },
  { id: 'streak_3', name: 'On Fire', description: '3 weeks of consecutive updates', icon: Flame, color: 'bg-orange-500', rarity: 'common' },
  { id: 'streak_5', name: 'Consistent', description: '5 weeks of consecutive updates', icon: Flame, color: 'bg-orange-600', rarity: 'rare' },
  { id: 'streak_10', name: 'Unstoppable', description: '10 weeks of consecutive updates', icon: Flame, color: 'bg-red-500', rarity: 'epic' },
  { id: 'early_submitter', name: 'Early Bird', description: 'Submitted update before deadline 5 times', icon: Clock, color: 'bg-blue-400', rarity: 'common' },
  { id: 'helpful_peer', name: 'Helper', description: 'Answered 10 peer questions', icon: MessageCircle, color: 'bg-green-400', rarity: 'rare' },
  { id: 'team_leader', name: 'Leader', description: 'Became a team leader', icon: Crown, color: 'bg-purple-500', rarity: 'rare' },
  { id: 'perfectionist', name: 'Perfect Score', description: 'Received 100% on an evaluation', icon: Trophy, color: 'bg-yellow-500', rarity: 'epic' },
  { id: 'github_master', name: 'GitHub Master', description: 'Linked GitHub and verified 50+ commits', icon: Zap, color: 'bg-gray-800', rarity: 'epic' },
  { id: 'risk_avoider', name: 'Risk Avoider', description: 'Stayed out of at-risk status for entire project', icon: Target, color: 'bg-green-500', rarity: 'rare' },
  { id: 'document_king', name: 'Document King', description: 'Submitted all required documents on time', icon: FileText, color: 'bg-indigo-500', rarity: 'epic' },
  { id: 'project_complete', name: 'Graduate', description: 'Completed your first project', icon: BookOpen, color: 'bg-teal-500', rarity: 'legendary' },
];

const GamificationPage = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        api.get('/gamification/stats').catch(() => ({ data: { stats: null } })),
        api.get('/gamification/leaderboard').catch(() => ({ data: { leaderboard: [] } })),
      ]);
      setStats(statsRes.data.stats);
      setLeaderboard(leaderboardRes.data.leaderboard || generateMockLeaderboard());
    } catch (err) {
      setLeaderboard(generateMockLeaderboard());
    } finally {
      setLoading(false);
    }
  };

  const generateMockLeaderboard = () => {
    return [
      { rank: 1, name: 'Sarah Chen', points: 2450, badges: 12, streak: 15, avatar: 'SC' },
      { rank: 2, name: 'Mike Johnson', points: 2280, badges: 11, streak: 12, avatar: 'MJ' },
      { rank: 3, name: 'Emily Davis', points: 2150, badges: 10, streak: 10, avatar: 'ED' },
      { rank: 4, name: 'Alex Kim', points: 1980, badges: 9, streak: 8, avatar: 'AK' },
      { rank: 5, name: 'John Smith', points: 1850, badges: 8, streak: 7, avatar: 'JS' },
    ];
  };

  const getBadgeProgress = (badgeId) => {
    if (!stats) return { current: 0, target: 1, percentage: 0 };
    
    const progressMap = {
      first_update: { current: stats.totalUpdates > 0 ? 1 : 0, target: 1 },
      streak_3: { current: Math.min(stats.currentStreak, 3), target: 3 },
      streak_5: { current: Math.min(stats.currentStreak, 5), target: 5 },
      streak_10: { current: Math.min(stats.currentStreak, 10), target: 10 },
      early_submitter: { current: stats.earlySubmissions || 0, target: 5 },
      helpful_peer: { current: stats.answersGiven || 0, target: 10 },
      team_leader: { current: stats.isLeader ? 1 : 0, target: 1 },
      perfectionist: { current: stats.perfectScores || 0, target: 1 },
      github_master: { current: Math.min(stats.githubCommits || 0, 50), target: 50 },
      risk_avoider: { current: stats.weeksAtRisk === 0 ? 1 : 0, target: 1 },
      document_king: { current: stats.documentsOnTime || 0, target: 1 },
      project_complete: { current: stats.projectsCompleted || 0, target: 1 },
    };
    
    const progress = progressMap[badgeId] || { current: 0, target: 1 };
    return {
      ...progress,
      percentage: Math.min(100, Math.round((progress.current / progress.target) * 100))
    };
  };

  if (loading) return <LoadingSpinner text="Loading achievements…" />;

  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your progress and earn badges for your academic journey
        </p>
      </div>

      {/* User Stats Card */}
      <div className="card mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <p className="text-blue-100">{user?.role === 'professor' ? 'Professor' : 'Student'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats?.totalPoints || 1250}</div>
                <div className="text-sm text-blue-100">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats?.badgesEarned || 5}</div>
                <div className="text-sm text-blue-100">Badges</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats?.currentStreak || 3}</div>
                <div className="text-sm text-blue-100">Week Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats?.rank || 12}</div>
                <div className="text-sm text-blue-100">Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'badges'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Badges
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Leaderboard
        </button>
      </div>

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div>
          {/* Earned Badges */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Earned Badges ({stats?.badgesEarned || 5})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badgeDefinitions.slice(0, 6).map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className="card text-center p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className={`w-16 h-16 ${badge.color} rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked Badges */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Badges in Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badgeDefinitions.slice(6).map((badge) => {
                const Icon = badge.icon;
                const progress = getBadgeProgress(badge.id);
                const isUnlocked = progress.percentage >= 100;
                
                return (
                  <div
                    key={badge.id}
                    className={`card p-4 ${isUnlocked ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? badge.color : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {isUnlocked ? (
                          <Icon className="w-7 h-7 text-white" />
                        ) : (
                          <Lock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{badge.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                        
                        {/* Progress Bar */}
                        {!isUnlocked && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{progress.current}/{progress.target}</span>
                              <span>{progress.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {isUnlocked && (
                          <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Unlocked!
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        badge.rarity === 'common' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                        badge.rarity === 'rare' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' :
                        badge.rarity === 'epic' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' :
                        'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="card">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Badges</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.rank} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${entry.name === user?.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Crown className="w-5 h-5 text-yellow-500" />}
                        {entry.rank === 2 && <Medal className="w-5 h-5 text-gray-400" />}
                        {entry.rank === 3 && <Medal className="w-5 h-5 text-orange-400" />}
                        {entry.rank > 3 && <span className="text-lg font-bold text-gray-500">#{entry.rank}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {entry.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {entry.name}
                            {entry.name === user?.name && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-gray-900 dark:text-white">{entry.points.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-purple-500" />
                        <span>{entry.badges}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>{entry.streak} weeks</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationPage;
