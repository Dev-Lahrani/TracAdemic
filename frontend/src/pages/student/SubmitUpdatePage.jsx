import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ErrorMessage from '../../components/common/ErrorMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Trash2, AlertTriangle, CheckSquare, Clock } from 'lucide-react';
import { getCurrentWeek, getWeekStartDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SubmitUpdatePage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    completedTasks: [{ title: '', description: '', hoursSpent: 0 }],
    plannedTasks: [{ title: '', description: '' }],
    blockers: [],
    individualContribution: '',
    contributionPercentage: 25,
    mood: 'good',
    hoursWorked: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}`);
        setProject(data.project);

        // Find the student's team
        const teamsRes = await api.get(`/teams/project/${projectId}`);
        const myTeam = teamsRes.data.teams.find((t) =>
          t.members.some((m) => {
            const uid = m.user?._id || m.user;
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            return uid === storedUser.id;
          })
        );
        if (myTeam) setTeamId(myTeam._id);
      } catch {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  const weekNumber = project?.startDate ? getCurrentWeek(project.startDate) : 1;

  const addCompletedTask = () => {
    setForm({ ...form, completedTasks: [...form.completedTasks, { title: '', description: '', hoursSpent: 0 }] });
  };

  const removeCompletedTask = (i) => {
    setForm({ ...form, completedTasks: form.completedTasks.filter((_, idx) => idx !== i) });
  };

  const updateCompletedTask = (i, field, value) => {
    const updated = [...form.completedTasks];
    updated[i][field] = field === 'hoursSpent' ? parseFloat(value) || 0 : value;
    setForm({ ...form, completedTasks: updated });
  };

  const addPlannedTask = () => {
    setForm({ ...form, plannedTasks: [...form.plannedTasks, { title: '', description: '' }] });
  };

  const removePlannedTask = (i) => {
    setForm({ ...form, plannedTasks: form.plannedTasks.filter((_, idx) => idx !== i) });
  };

  const addBlocker = () => {
    setForm({ ...form, blockers: [...form.blockers, { description: '', severity: 'medium', resolved: false }] });
  };

  const removeBlocker = (i) => {
    setForm({ ...form, blockers: form.blockers.filter((_, idx) => idx !== i) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamId) {
      return setError('You are not in a team for this project. Please join a team first.');
    }
    if (!form.individualContribution.trim()) {
      return setError('Individual contribution summary is required.');
    }

    setError('');
    setSubmitting(true);
    try {
      await api.post('/updates', {
        projectId,
        teamId,
        weekNumber,
        weekStartDate: getWeekStartDate(project.startDate, weekNumber),
        ...form,
      });
      toast.success('Weekly update submitted successfully!');
      navigate(`/student/projects/${projectId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit update.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading project…" />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Weekly Update</h1>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span>{project?.title}</span>
          <span>·</span>
          <span className="badge-blue">Week {weekNumber}</span>
        </div>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Mood & Hours */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">How was your week?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Team Mood</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'great', emoji: '😄', label: 'Great' },
                  { value: 'good', emoji: '🙂', label: 'Good' },
                  { value: 'okay', emoji: '😐', label: 'Okay' },
                  { value: 'struggling', emoji: '😟', label: 'Struggling' },
                ].map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, mood: value })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-colors text-xs ${
                      form.mood === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Total Hours Worked</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="168"
                  className="input-field pl-9"
                  placeholder="e.g. 15"
                  value={form.hoursWorked}
                  onChange={(e) => setForm({ ...form, hoursWorked: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="mt-4">
                <label className="label">My Contribution % (of team total)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="flex-1 accent-blue-600"
                    value={form.contributionPercentage}
                    onChange={(e) => setForm({ ...form, contributionPercentage: parseInt(e.target.value) })}
                  />
                  <span className="text-sm font-medium text-blue-600 w-10 text-right">
                    {form.contributionPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Contribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">My Contribution This Week *</h2>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Describe what you personally worked on and contributed to the project this week…"
            value={form.individualContribution}
            onChange={(e) => setForm({ ...form, individualContribution: e.target.value })}
            required
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.individualContribution.length}/1000</p>
        </div>

        {/* Completed Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-green-500" />
              Completed Tasks
            </h2>
            <button type="button" onClick={addCompletedTask} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
          <div className="space-y-3">
            {form.completedTasks.map((task, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Task name *"
                    value={task.title}
                    onChange={(e) => updateCompletedTask(i, 'title', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="input-field w-20"
                    placeholder="hrs"
                    value={task.hoursSpent || ''}
                    onChange={(e) => updateCompletedTask(i, 'hoursSpent', e.target.value)}
                  />
                  {form.completedTasks.length > 1 && (
                    <button type="button" onClick={() => removeCompletedTask(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Brief description (optional)"
                  value={task.description}
                  onChange={(e) => updateCompletedTask(i, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Planned Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Planned Next Week
            </h2>
            <button type="button" onClick={addPlannedTask} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
          <div className="space-y-2">
            {form.plannedTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Planned task"
                  value={task.title}
                  onChange={(e) => {
                    const updated = [...form.plannedTasks];
                    updated[i].title = e.target.value;
                    setForm({ ...form, plannedTasks: updated });
                  }}
                />
                {form.plannedTasks.length > 1 && (
                  <button type="button" onClick={() => removePlannedTask(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blockers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Blockers & Challenges
            </h2>
            <button type="button" onClick={addBlocker} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Blocker
            </button>
          </div>
          {form.blockers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No blockers this week? Great! Add one if something is slowing you down.
            </p>
          ) : (
            <div className="space-y-3">
              {form.blockers.map((blocker, i) => (
                <div key={i} className="bg-yellow-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <textarea
                      className="input-field flex-1 resize-none"
                      rows={2}
                      placeholder="Describe the blocker…"
                      value={blocker.description}
                      onChange={(e) => {
                        const updated = [...form.blockers];
                        updated[i].description = e.target.value;
                        setForm({ ...form, blockers: updated });
                      }}
                    />
                    <button type="button" onClick={() => removeBlocker(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    className="input-field w-32 text-sm"
                    value={blocker.severity}
                    onChange={(e) => {
                      const updated = [...form.blockers];
                      updated[i].severity = e.target.value;
                      setForm({ ...form, blockers: updated });
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={submitting}>
            <CheckSquare className="w-4 h-4" />
            {submitting ? 'Submitting…' : 'Submit Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitUpdatePage;
