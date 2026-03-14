import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  ClipboardCheck, Plus, Star, TrendingUp, User, Award,
  ChevronRight, Target, Brain, CheckCircle, Clock
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EvaluationsPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  
  const [evaluations, setEvaluations] = useState([]);
  const [suggestedMarks, setSuggestedMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEval, setSelectedEval] = useState(null);
  const [loadingMarks, setLoadingMarks] = useState({});
  
  const [newEvaluation, setNewEvaluation] = useState({
    title: '',
    description: '',
    type: 'weekly',
    maxMarks: 100,
    dueDate: '',
    criteria: [{ name: 'Documentation', weight: 20 }],
  });

  useEffect(() => {
    fetchEvaluations();
  }, [projectId]);

  const fetchEvaluations = async () => {
    try {
      const res = await api.get(`/evaluations/project/${projectId}`);
      setEvaluations(res.data.evaluations || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvaluation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/evaluations', {
        ...newEvaluation,
        project: projectId,
      });
      toast.success('Evaluation created successfully');
      setShowForm(false);
      setNewEvaluation({
        title: '',
        description: '',
        type: 'weekly',
        maxMarks: 100,
        dueDate: '',
        criteria: [{ name: 'Documentation', weight: 20 }],
      });
      fetchEvaluations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create evaluation');
    }
  };

  const getSuggestedMarks = async (studentId) => {
    setLoadingMarks(prev => ({ ...prev, [studentId]: true }));
    try {
      const res = await api.get(`/evaluations/suggest/${projectId}/${studentId}`);
      setSuggestedMarks(prev => ({ ...prev, [studentId]: res.data.suggestedMarks }));
      toast.success('AI suggested marks generated');
    } catch (err) {
      toast.error('Failed to get suggested marks');
    } finally {
      setLoadingMarks(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const addCriterion = () => {
    setNewEvaluation({
      ...newEvaluation,
      criteria: [...newEvaluation.criteria, { name: '', weight: 0 }],
    });
  };

  const updateCriterion = (index, field, value) => {
    const criteria = [...newEvaluation.criteria];
    criteria[index][field] = value;
    setNewEvaluation({ ...newEvaluation, criteria });
  };

  const removeCriterion = (index) => {
    const criteria = newEvaluation.criteria.filter((_, i) => i !== index);
    setNewEvaluation({ ...newEvaluation, criteria });
  };

  if (loading) return <LoadingSpinner text="Loading evaluations…" />;

  const isProfessor = user?.role === 'professor';
  const totalCriteriaWeight = newEvaluation.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to={isProfessor ? `/professor/projects/${projectId}` : `/student/projects/${projectId}`} className="hover:text-blue-600">
              {isProfessor ? 'Projects' : 'My Projects'}
            </Link>
            <span>/</span>
            <span>Evaluations</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluations & Grades</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isProfessor ? 'Create assessments and track student performance' : 'View your assessment results and progress'}
          </p>
        </div>
        
        {isProfessor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Evaluation
          </button>
        )}
      </div>

      {/* AI Assistant Banner */}
      {isProfessor && (
        <div className="card mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Grading Assistant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get AI-powered grade suggestions based on student contributions and progress
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Form */}
      {showForm && (
        <div className="card mb-6 animate-scale-in">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Create New Evaluation</h3>
          <form onSubmit={handleCreateEvaluation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Evaluation Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Midterm Assessment"
                  value={newEvaluation.title}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input-field"
                  value={newEvaluation.type}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, type: e.target.value })}
                >
                  <option value="weekly">Weekly Update</option>
                  <option value="milestone">Milestone</option>
                  <option value="presentation">Presentation</option>
                  <option value="final">Final Submission</option>
                  <option value="peer">Peer Review</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Evaluation criteria and requirements..."
                value={newEvaluation.description}
                onChange={(e) => setNewEvaluation({ ...newEvaluation, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Maximum Marks</label>
                <input
                  type="number"
                  className="input-field"
                  min="1"
                  value={newEvaluation.maxMarks}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, maxMarks: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="label">Due Date (optional)</label>
                <input
                  type="date"
                  className="input-field"
                  value={newEvaluation.dueDate}
                  onChange={(e) => setNewEvaluation({ ...newEvaluation, dueDate: e.target.value })}
                />
              </div>
            </div>
            
            {/* Criteria */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Grading Criteria</label>
                <button
                  type="button"
                  onClick={addCriterion}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Criterion
                </button>
              </div>
              
              <div className="space-y-2">
                {newEvaluation.criteria.map((criterion, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="input-field flex-1"
                      placeholder="Criterion name"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(idx, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field w-24"
                      placeholder="Weight"
                      min="0"
                      max="100"
                      value={criterion.weight}
                      onChange={(e) => updateCriterion(idx, 'weight', parseInt(e.target.value))}
                    />
                    <span className="text-sm text-gray-500">%</span>
                    {newEvaluation.criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-2 text-sm">
                <span className={totalCriteriaWeight !== 100 ? 'text-red-500' : 'text-green-500'}>
                  Total weight: {totalCriteriaWeight}%
                </span>
                {totalCriteriaWeight !== 100 && (
                  <span className="text-red-500">Weights should add up to 100%</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={totalCriteriaWeight !== 100}
              >
                Create Evaluation
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <ClipboardCheck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{evaluations.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="card text-center">
          <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {evaluations.filter(e => !e.dueDate || new Date(e.dueDate) > new Date()).length}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="card text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {evaluations.filter(e => e.dueDate && new Date(e.dueDate) <= new Date()).length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {evaluations.reduce((sum, e) => sum + (e.maxMarks || 0), 0)}
          </div>
          <div className="text-sm text-gray-500">Total Marks</div>
        </div>
      </div>

      {/* Evaluations List */}
      {evaluations.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">No evaluations yet</h3>
          <p className="text-gray-400 text-sm mt-1">
            {isProfessor ? 'Create your first evaluation to get started.' : 'Your professor hasn\'t created any evaluations yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const isDue = evaluation.dueDate && new Date(evaluation.dueDate) <= new Date();
            
            return (
              <div 
                key={evaluation._id} 
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedEval(selectedEval === evaluation._id ? null : evaluation._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{evaluation.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {evaluation.maxMarks} marks
                        </span>
                        <span className="capitalize">{evaluation.type}</span>
                        {evaluation.criteria?.length > 0 && (
                          <span>{evaluation.criteria.length} criteria</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isDue ? (
                      <span className="badge badge-gray">Closed</span>
                    ) : (
                      <span className="badge badge-green">Active</span>
                    )}
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${selectedEval === evaluation._id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedEval === evaluation._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                    {evaluation.description && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.description}</p>
                      </div>
                    )}
                    
                    {evaluation.criteria?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grading Criteria:</h4>
                        <div className="space-y-2">
                          {evaluation.criteria.map((criterion, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{criterion.name}</span>
                              <span className="font-medium text-gray-900 dark:text-white">{criterion.weight}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {evaluation.dueDate && (
                      <div className="text-sm text-gray-500">
                        Due: {formatDate(evaluation.dueDate)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvaluationsPage;
