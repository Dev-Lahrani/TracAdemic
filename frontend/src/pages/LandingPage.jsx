import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Brain, BarChart3, GitBranch, ArrowRight, Sparkles, Shield, Users, BookOpen, TrendingUp, Sun, Moon } from 'lucide-react';

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get automated weekly summaries, risk predictions, and contribution analysis powered by AI.',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/30',
    },
    {
      icon: GitBranch,
      title: 'GitHub Integration',
      description: 'Automatically verify contributions by analyzing commits, pull requests, and code reviews.',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      icon: BarChart3,
      title: 'Team Analytics',
      description: 'Visualize team productivity, contribution heatmaps, and weekly progress trends.',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      icon: Shield,
      title: 'Academic Integrity',
      description: 'Detect suspicious patterns, contribution imbalances, and last-minute activity spikes.',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/30',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Assisted Academic Project Management
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
            Track. Analyze.<br />
            <span className="text-yellow-300">Succeed.</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            ProjectPulse helps professors and students manage academic projects with AI-powered insights,
            real-time analytics, and GitHub contribution verification.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
              Start for Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="border border-white/40 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
        <div className="h-16 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900" />
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Everything you need to succeed</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">A complete platform for managing academic projects from start to finish.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-gray-100 dark:border-gray-600 hover:shadow-md hover:scale-105 transition-all duration-300">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '5,000+', label: 'Students Tracked', icon: Users },
              { value: '500+', label: 'Projects Managed', icon: BookOpen },
              { value: '98%', label: 'On-time Delivery', icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="p-6">
                <stat.icon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-4xl font-extrabold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your classroom?</h2>
          <p className="text-blue-100 mb-8">Join thousands of professors and students using ProjectPulse.</p>
          <Link to="/register" className="bg-white text-blue-700 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 inline-flex items-center gap-2 shadow-lg">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2025 ProjectPulse. Built for academic excellence.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
