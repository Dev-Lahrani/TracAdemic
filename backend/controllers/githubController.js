/**
 * GitHub Contribution Verification Controller
 * Analyzes a student's GitHub activity and generates a contribution authenticity score.
 */
const axios = require('axios').default;
const User = require('../models/User');
const WeeklyUpdate = require('../models/WeeklyUpdate');
const Team = require('../models/Team');

// @desc    Analyze GitHub contributions for a student
// @route   GET /api/github/contribution/:studentId
// @access  Private
const analyzeGitHubContribution = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { username, projectId } = req.query;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // If no GitHub username provided, return score based on weekly updates alone
    if (!username) {
      return analyzeFromUpdatesOnly(req, res, student, projectId);
    }

    // Try to fetch from GitHub API
    const githubToken = process.env.GITHUB_TOKEN;
    const headers = githubToken ? { Authorization: `token ${githubToken}` } : {};

    let githubData = null;
    let githubError = null;

    try {
      const eventsRes = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
        { headers, timeout: 8000 }
      );

      const reposRes = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated`,
        { headers, timeout: 8000 }
      );

      const profileRes = await axios.get(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        { headers, timeout: 8000 }
      );

      const events = eventsRes.data || [];
      const repos = reposRes.data || [];
      const profile = profileRes.data || {};

      // Analyze events from the last 90 days
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(e => new Date(e.created_at) > cutoff);

      const pushEvents = recentEvents.filter(e => e.type === 'PushEvent');
      const prEvents = recentEvents.filter(e => e.type === 'PullRequestEvent');
      const reviewEvents = recentEvents.filter(e => e.type === 'PullRequestReviewEvent');
      const issueEvents = recentEvents.filter(e => e.type === 'IssuesEvent');

      const totalCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);
      // GitHub's public events API does not expose per-commit line diffs, so we use a rough
      // heuristic: LINES_PER_COMMIT_ESTIMATE lines changed per commit as a conservative average.
      const LINES_PER_COMMIT_ESTIMATE = 25;
      const linesChanged = pushEvents.reduce((sum, e) => {
        return sum + (e.payload?.commits?.length || 0) * LINES_PER_COMMIT_ESTIMATE;
      }, 0);

      const activityByRepo = {};
      pushEvents.forEach(e => {
        const repoName = e.repo?.name || 'unknown';
        if (!activityByRepo[repoName]) {
          activityByRepo[repoName] = { commits: 0, prs: 0 };
        }
        activityByRepo[repoName].commits += e.payload?.commits?.length || 0;
      });
      prEvents.forEach(e => {
        const repoName = e.repo?.name || 'unknown';
        if (!activityByRepo[repoName]) {
          activityByRepo[repoName] = { commits: 0, prs: 0 };
        }
        activityByRepo[repoName].prs++;
      });

      // Weekly activity breakdown (last 12 weeks)
      const weeklyActivity = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
        const weekEvents = recentEvents.filter(e => {
          const d = new Date(e.created_at);
          return d >= weekStart && d < weekEnd;
        });
        const weekCommits = weekEvents
          .filter(e => e.type === 'PushEvent')
          .reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);
        weeklyActivity.push({
          week: 12 - i,
          commits: weekCommits,
          prs: weekEvents.filter(e => e.type === 'PullRequestEvent').length,
          reviews: weekEvents.filter(e => e.type === 'PullRequestReviewEvent').length,
        });
      }

      githubData = {
        profile: {
          login: profile.login,
          name: profile.name,
          publicRepos: profile.public_repos,
          followers: profile.followers,
          avatarUrl: profile.avatar_url,
        },
        metrics: {
          totalCommits,
          pullRequests: prEvents.length,
          linesChanged,
          reviewActivity: reviewEvents.length,
          issueActivity: issueEvents.length,
          activeRepos: Object.keys(activityByRepo).length,
        },
        activityByRepo: Object.entries(activityByRepo)
          .map(([repo, stats]) => ({ repo, ...stats }))
          .sort((a, b) => b.commits - a.commits)
          .slice(0, 10),
        weeklyActivity,
      };
    } catch (err) {
      githubError = err.response?.status === 404
        ? `GitHub user "${username}" not found`
        : err.response?.status === 403
        ? 'GitHub API rate limit exceeded. Please provide a GITHUB_TOKEN environment variable.'
        : `GitHub API error: ${err.message}`;
    }

    // Get weekly updates for comparison
    let weeklyUpdates = [];
    if (projectId) {
      const team = await Team.findOne({ project: projectId, 'members.user': studentId });
      if (team) {
        weeklyUpdates = await WeeklyUpdate.find({
          project: projectId,
          student: studentId,
        }).sort({ weekNumber: 1 });
      }
    }

    const score = calculateAuthenticityScore(githubData, weeklyUpdates);

    res.json({
      success: true,
      studentId,
      studentName: student.name,
      githubUsername: username || null,
      githubData,
      githubError,
      weeklyUpdates: weeklyUpdates.map(u => ({
        weekNumber: u.weekNumber,
        hoursWorked: u.hoursWorked,
        contributionPercentage: u.contributionPercentage,
        completedTaskCount: (u.completedTasks || []).length,
        blockerCount: (u.blockers || []).length,
        mood: u.mood,
      })),
      authenticityScore: score,
      analysisNote: githubError
        ? 'Score calculated from weekly updates only (GitHub unavailable)'
        : 'Score calculated combining GitHub activity and self-reported updates',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Calculate an authenticity score (0-100) by comparing GitHub activity
 * with self-reported weekly updates.
 */
const calculateAuthenticityScore = (githubData, weeklyUpdates) => {
  if (!githubData && weeklyUpdates.length === 0) {
    return { score: 0, grade: 'insufficient_data', factors: ['No GitHub data and no weekly updates found'] };
  }

  const factors = [];
  let score = 50; // Start at neutral

  if (githubData) {
    const { metrics } = githubData;

    if (metrics.totalCommits >= 20) {
      score += 20;
      factors.push(`Strong commit activity: ${metrics.totalCommits} commits in last 90 days`);
    } else if (metrics.totalCommits >= 5) {
      score += 10;
      factors.push(`Moderate commit activity: ${metrics.totalCommits} commits`);
    } else if (metrics.totalCommits > 0) {
      score += 3;
      factors.push(`Low commit activity: only ${metrics.totalCommits} commits`);
    } else {
      score -= 10;
      factors.push('No commits found in GitHub activity');
    }

    if (metrics.pullRequests >= 3) {
      score += 10;
      factors.push(`Active PR participation: ${metrics.pullRequests} pull requests`);
    } else if (metrics.pullRequests > 0) {
      score += 5;
      factors.push(`Some PR activity: ${metrics.pullRequests} pull requests`);
    }

    if (metrics.reviewActivity >= 2) {
      score += 5;
      factors.push(`Peer review engagement: ${metrics.reviewActivity} reviews`);
    }
  }

  if (weeklyUpdates.length > 0) {
    const totalReportedHours = weeklyUpdates.reduce((sum, u) => sum + (u.hoursWorked || 0), 0);
    const avgHoursPerWeek = totalReportedHours / weeklyUpdates.length;
    const submitRate = weeklyUpdates.length;

    if (submitRate >= 4) {
      score += 10;
      factors.push(`Consistent weekly reporting: ${submitRate} updates submitted`);
    } else if (submitRate >= 2) {
      score += 5;
      factors.push(`Regular reporting: ${submitRate} updates submitted`);
    }

    if (githubData && githubData.metrics.totalCommits === 0 && avgHoursPerWeek > 10) {
      score -= 15;
      factors.push(`Warning: Claims ${avgHoursPerWeek.toFixed(1)}h/week but no GitHub commits detected`);
    } else if (githubData && githubData.metrics.totalCommits > 0 && avgHoursPerWeek > 0) {
      score += 5;
      factors.push('GitHub activity aligns with reported hours');
    }
  }

  score = Math.max(0, Math.min(100, score));

  let grade;
  if (score >= 80) grade = 'high';
  else if (score >= 60) grade = 'medium';
  else if (score >= 40) grade = 'low';
  else grade = 'suspicious';

  return { score, grade, factors };
};

/**
 * Fallback when no GitHub username: analyze from weekly updates only.
 */
const analyzeFromUpdatesOnly = async (req, res, student, projectId) => {
  let weeklyUpdates = [];
  if (projectId) {
    weeklyUpdates = await WeeklyUpdate.find({
      project: projectId,
      student: student._id,
    }).sort({ weekNumber: 1 });
  }

  const score = calculateAuthenticityScore(null, weeklyUpdates);

  res.json({
    success: true,
    studentId: student._id,
    studentName: student.name,
    githubUsername: null,
    githubData: null,
    githubError: null,
    weeklyUpdates: weeklyUpdates.map(u => ({
      weekNumber: u.weekNumber,
      hoursWorked: u.hoursWorked,
      contributionPercentage: u.contributionPercentage,
      completedTaskCount: (u.completedTasks || []).length,
      blockerCount: (u.blockers || []).length,
      mood: u.mood,
    })),
    authenticityScore: score,
    analysisNote: 'Score calculated from weekly updates only (no GitHub username provided)',
  });
};

module.exports = { analyzeGitHubContribution };
