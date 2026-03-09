/**
 * Format a date to a readable string.
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/**
 * Get the number of weeks between two dates.
 */
export const getWeeksBetween = (startDate, endDate) => {
  const ms = new Date(endDate) - new Date(startDate);
  return Math.ceil(ms / (7 * 24 * 60 * 60 * 1000));
};

/**
 * Get the current week number relative to a project start date.
 */
export const getCurrentWeek = (startDate) => {
  const ms = Date.now() - new Date(startDate);
  return Math.max(1, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
};

/**
 * Get week start date given a project start date and week number.
 */
export const getWeekStartDate = (projectStartDate, weekNumber) => {
  const start = new Date(projectStartDate);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  return start;
};

/**
 * Map mood to emoji.
 */
export const moodEmoji = (mood) => {
  const map = { great: '😄', good: '🙂', okay: '😐', struggling: '😟' };
  return map[mood] || '🙂';
};

/**
 * Map risk level to color classes.
 */
export const riskColor = (level) => {
  const map = {
    low: 'badge-green',
    medium: 'badge-yellow',
    high: 'badge-red',
    critical: 'badge bg-red-200 text-red-900',
  };
  return map[level] || 'badge-gray';
};

/**
 * Truncate text to a given length.
 */
export const truncate = (text, length = 100) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}…` : text;
};
