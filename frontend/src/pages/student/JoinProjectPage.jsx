import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Hash, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const JoinProjectPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ inviteCode: '', teamName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/projects/join', {
        inviteCode: form.inviteCode.toUpperCase(),
        teamName: form.teamName,
      });
      toast.success(`Successfully joined ${data.project.title}!`);
      navigate(`/student/projects/${data.project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Join a Project</h1>
        <p className="text-gray-500 mt-1">Enter the invite code provided by your professor.</p>
      </div>

      <div className="card">
        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="label">Invite Code</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9 uppercase tracking-widest font-mono"
                placeholder="e.g. ABC123"
                value={form.inviteCode}
                onChange={(e) => setForm({ ...form, inviteCode: e.target.value.toUpperCase() })}
                maxLength={8}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Team Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="e.g. Team Alpha (or existing team name to join)"
                value={form.teamName}
                onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Enter a new team name to create it, or an existing team name to join that team.
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? 'Joining…' : (
              <>Join Project <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinProjectPage;
