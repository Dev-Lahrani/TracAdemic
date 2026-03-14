import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  UserCheck, UserX, Users, Brain, BarChart3, Target,
  AlertTriangle, CheckCircle, Shuffle, Clock, Zap, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

const AssignmentsPage = () => {
  const { projectId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');

  // Sample data for demonstration
  useEffect(() => {
    const sampleMembers = [
      { id: '1', name: 'Alice Chen', skills: { technical: ['JavaScript', 'React', 'Node.js'], soft: ['Leadership'] }, availability: 4, currentWorkload: 8, capacity: 40, averagePerformance: 85 },
      { id: '2', name: 'Bob Johnson', skills: { technical: ['Python', 'Django', 'SQL'], soft: ['Documentation'] }, availability: 5, currentWorkload: 15, capacity: 40, averagePerformance: 78 },
      { id: '3', name: 'Carol Williams', skills: { technical: ['UI/UX', 'CSS', 'Figma'], soft: ['Design'] }, availability: 3, currentWorkload: 5, capacity: 40, averagePerformance: 90 },
      { id: '4', name: 'David Lee', skills: { technical: ['DevOps', 'Docker', 'AWS'], soft: ['Architecture'] }, availability: 5, currentWorkload: 20, capacity: 40, averagePerformance: 82 },
    ];

    const sampleTasks = [
      { id: '1', name: 'Build user authentication', priority: 'high', complexity: 3, requiredSkills: ['JavaScript', 'Node.js'] },
      { id: '2', name: 'Design database schema', priority: 'high', complexity: 2, requiredSkills: ['SQL', 'Architecture'] },
      { id: '3', name: 'Create UI components', priority: 'medium', complexity: 2, requiredSkills: ['UI/UX', 'CSS'] },
      { id: '4', name: 'Set up deployment pipeline', priority: 'high', complexity: 3, requiredSkills: ['DevOps', 'Docker'] },
      { id: '5', name: 'Write API documentation', priority: 'low', complexity: 1, requiredSkills: ['Documentation'] },
      { id: '6', name: 'Implement search feature', priority: 'medium', complexity: 2, requiredSkills: ['JavaScript', 'React'] },
    ];

    setTeamMembers(sampleMembers);
    setTasks(sampleTasks);
    setWorkload(calculateWorkloadDistribution(sampleMembers));
  }, []);

  const suggestAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.post('/assignments/suggest', {
        projectId,
        tasks,
        teamMembers,
      });
      setAssignments(res.data.assignments);
      toast.success('AI generated task assignments!');
    } catch (err) {
      // Use sample data if API fails
      generateSampleAssignments();
      toast.success('Generated sample assignments');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleAssignments = () => {
    const sampleAssignments = [
      { taskId: '1', taskName: 'Build user authentication', assigneeId: '1', assigneeName: 'Alice Chen', predictedHours: 6, score: 92, reasoning: 'Perfect skill match, Available capacity' },
      { taskId: '2', taskName: 'Design database schema', assigneeId: '4', assigneeName: 'David Lee', predictedHours: 4, score: 88, reasoning: 'Architecture expertise' },
      { taskId: '3', taskName: 'Create UI components', assigneeId: '3', assigneeName: 'Carol Williams', predictedHours: 5, score: 95, reasoning: 'Perfect skill match' },
      { taskId: '4', taskName: 'Set up deployment pipeline', assigneeId: '4', assigneeName: 'David Lee', predictedHours: 8, score: 85, reasoning: 'DevOps expertise' },
      { taskId: '5', taskName: 'Write API documentation', assigneeId: '2', assigneeName: 'Bob Johnson', predictedHours: 3, score: 78, reasoning: 'Documentation skills' },
      { taskId: '6', taskName: 'Implement search feature', assigneeId: '1', assigneeName: 'Alice Chen', predictedHours: 5, score: 88, reasoning: 'Good skill match' },
    ];
    setAssignments(sampleAssignments);
  };

  const getLoadColor = (utilization) => {
    if (utilization > 90) return 'bg-red-500';
    if (utilization > 70) return 'bg-yellow-500';
    if (utilization > 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const calculateWorkloadDistribution = (members) => {
    return members.map(member => ({
      ...member,
      utilization: Math.round(((member.currentWorkload || 0) / (member.capacity || 40)) * 100),
      status: getWorkloadStatus(member.currentWorkload || 0, member.capacity || 40),
    }));
  };

  const getWorkloadStatus = (current, capacity) => {
    const utilization = current / capacity;
    if (utilization > 0.9) return 'overloaded';
    if (utilization > 0.7) return 'busy';
    if (utilization > 0.4) return 'moderate';
    return 'light';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-7 h-7 text-purple-600" />
          Smart Task Distribution
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          AI-powered task assignment based on skills, workload, and performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Team & Workload */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Team Members
            </h3>
            <div className="space-y-3">
              {workload.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {member.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                        member.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        member.status === 'moderate' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {member.utilization}%
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${getLoadColor(member.utilization)}`}
                        style={{ width: `${member.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> Tasks to Assign
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className={`badge ${
                    task.priority === 'high' ? 'badge-red' :
                    task.priority === 'medium' ? 'badge-yellow' : 'badge-gray'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - AI Suggestions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['suggestions', 'workload'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tab === 'suggestions' ? 'AI Suggestions' : 'Workload Analysis'}
                </button>
              ))}
            </div>
            <button
              onClick={suggestAssignments}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-pulse" /> Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" /> Generate Assignments
                </>
              )}
            </button>
          </div>

          {loading && <LoadingSpinner text="Analyzing team capabilities..." />}

          {activeTab === 'suggestions' && !loading && (
            <div className="space-y-3 animate-fade-in">
              {assignments.length === 0 ? (
                <div className="card text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-500 dark:text-gray-400">No Suggestions Yet</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Generate Assignments" to get AI-powered task suggestions
                  </p>
                </div>
              ) : (
                assignments.map((assignment, i) => (
                  <div key={i} className="card hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                          {assignment.assigneeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {assignment.taskName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Assigned to {assignment.assigneeName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          assignment.score > 80 ? 'text-green-600' :
                          assignment.score > 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {assignment.predictedHours}h
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.reasoning}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${assignment.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {assignment.score}% match
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'workload' && !loading && (
            <div className="card animate-fade-in">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Workload Distribution Analysis
              </h3>
              <div className="space-y-4">
                {workload.map((member) => (
                  <div key={member.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{member.name}</span>
                      <span className="text-gray-500">{member.currentWorkload}/{member.capacity} hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getLoadColor(member.utilization)}`}
                          style={{ width: `${member.utilization}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                        member.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        member.status === 'moderate' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Recommendations
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Consider rebalancing tasks from David Lee (overloaded)</li>
                  <li>• Carol Williams has capacity for additional tasks</li>
                  <li>• Alice Chen can handle high-priority technical tasks</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
