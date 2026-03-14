import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Zap } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'professor' ? '/professor/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">trackAcademic</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">AI-Assisted Academic Project Management</p>
        </div>

        <div className="card shadow-xl">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in to your account</h2>

          <ErrorMessage message={error} />

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@university.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 p-4 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Demo accounts</p>
          <p>Professor: professor@demo.com / demo1234</p>
          <p>Student: student@demo.com / demo1234</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
