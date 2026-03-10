import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Plus, Trash2, Calendar, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    course: '',
    semester: '',
    startDate: '',
    endDate: '',
    tags: '',
    minTeamSize: 1,
    maxTeamSize: 5,
  });

  const [milestones, setMilestones] = useState([
    { title: '', description: '', dueDate: '' },
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', dueDate: '' }]);
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index, field, value) => {
    const updated = [...milestones];
    updated[index][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const validMilestones = milestones.filter((m) => m.title && m.dueDate);
      const { data } = await api.post('/projects', {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        milestones: validMilestones,
      });
      toast.success('Project created successfully!');
      navigate(`/professor/projects/${data.project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-500 mt-1">Set up a new academic project for your students.</p>
      </div>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        {/* Basic info */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500" />
            Project Details
          </h2>

          <div>
            <label className="label">Project Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Machine Learning Research Project"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Describe the project objectives, scope, and expected outcomes…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Course Code</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. CS501"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Semester</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Spring 2026"
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input-field"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                className="input-field"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. AI, Machine Learning, Python"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Team Size</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={form.maxTeamSize}
                value={form.minTeamSize}
                onChange={(e) => setForm({ ...form, minTeamSize: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="label">Max Team Size</label>
              <input
                type="number"
                className="input-field"
                min={form.minTeamSize}
                max={50}
                value={form.maxTeamSize}
                onChange={(e) => setForm({ ...form, maxTeamSize: parseInt(e.target.value) || 5 })}
              />
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Milestones
            </h2>
            <button type="button" onClick={addMilestone} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Milestone
            </button>
          </div>

          {milestones.map((milestone, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Milestone {index + 1}</span>
                {milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(index)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Literature Review"
                    value={milestone.title}
                    onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-xs">Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={milestone.dueDate}
                    onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs">Description (optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Brief description of this milestone…"
                  value={milestone.description}
                  onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <Plus className="w-4 h-4" />
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
