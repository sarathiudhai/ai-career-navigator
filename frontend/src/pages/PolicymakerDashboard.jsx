import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  FileText,
  Download,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
  Loader2,
  AlertTriangle,
  Award
} from 'lucide-react';
import apiClient from '../utils/api';

const PolicymakerDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getSystemAnalytics();
      setAnalyticsData(data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading state ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-slate-600">Loading policy dashboard...</span>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchAnalyticsData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // ── Extract API data ────────────────────────────────────────
  const userStats = analyticsData?.user_statistics || {};
  const courseStats = analyticsData?.course_statistics || {};
  const certStats = analyticsData?.certification_statistics || {};
  const engagementStats = analyticsData?.engagement_metrics || {};

  // Build key metrics from real API data
  const keyMetrics = [
    {
      title: 'Total Learners',
      value: userStats.learners?.toLocaleString() || '0',
      subtitle: `${userStats.total_users || 0} total users`,
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Active Courses',
      value: courseStats.total_courses?.toString() || '0',
      subtitle: `${courseStats.total_enrollments || 0} enrollments`,
      icon: BookOpen,
      color: 'success'
    },
    {
      title: 'Completion Rate',
      value: `${courseStats.average_completion_rate || 0}%`,
      subtitle: 'Average across all courses',
      icon: Target,
      color: 'emerald'
    },
    {
      title: 'Certifications',
      value: certStats.total_certifications?.toString() || '0',
      subtitle: `${engagementStats.active_learners || 0} active learners`,
      icon: Award,
      color: 'amber'
    }
  ];

  // Build role distribution from real data
  const roleDistribution = [
    { role: 'Learners', count: userStats.learners || 0, color: 'primary' },
    { role: 'Trainers', count: userStats.trainers || 0, color: 'success' },
    { role: 'Policymakers', count: userStats.policymakers || 0, color: 'amber' }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-success-600" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Policy Dashboard</h1>
            <p className="text-slate-600">National skill development insights and analytics</p>
          </div>
          <button onClick={fetchAnalyticsData} className="btn-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* Key Metrics — ALL from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {keyMetrics.map((metric, index) => (
          <motion.div key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            className="card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${metric.color}-100 rounded-xl flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</h3>
            <p className="text-sm text-slate-600">{metric.title}</p>
            <p className="text-xs text-slate-400 mt-1">{metric.subtitle}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* User Distribution — from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Role Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">User Distribution</h3>
          <div className="space-y-4">
            {roleDistribution.map((item) => {
              const total = userStats.total_users || 1;
              const percentage = Math.round((item.count / total) * 100);
              return (
                <div key={item.role}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{item.role}</span>
                    <span className="text-sm text-slate-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <motion.div
                      className={`bg-${item.color}-500 h-3 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Total Users</span>
              <span className="text-lg font-bold text-slate-900">{userStats.total_users || 0}</span>
            </div>
          </div>
        </div>

        {/* Platform Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Platform Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary-50 rounded-xl text-center">
              <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{courseStats.total_courses || 0}</p>
              <p className="text-xs text-slate-600">Total Courses</p>
            </div>
            <div className="p-4 bg-success-50 rounded-xl text-center">
              <Users className="w-8 h-8 text-success-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{courseStats.total_enrollments || 0}</p>
              <p className="text-xs text-slate-600">Enrollments</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{certStats.total_certifications || 0}</p>
              <p className="text-xs text-slate-600">Certifications</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{engagementStats.active_learners || 0}</p>
              <p className="text-xs text-slate-600">Active Learners</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Metrics Table — from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="card mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">Detailed Analytics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Metric</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Value</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {([
                { metric: 'Total Users', value: userStats.total_users || 0, status: userStats.total_users > 0 ? 'active' : 'empty' },
                { metric: 'Learners', value: userStats.learners || 0, status: userStats.learners > 0 ? 'active' : 'empty' },
                { metric: 'Trainers', value: userStats.trainers || 0, status: userStats.trainers > 0 ? 'active' : 'empty' },
                { metric: 'Total Courses', value: courseStats.total_courses || 0, status: courseStats.total_courses > 0 ? 'active' : 'empty' },
                { metric: 'Total Enrollments', value: courseStats.total_enrollments || 0, status: courseStats.total_enrollments > 0 ? 'active' : 'empty' },
                { metric: 'Avg Completion Rate', value: `${courseStats.average_completion_rate || 0}%`, status: (courseStats.average_completion_rate || 0) > 50 ? 'good' : 'needs_attention' },
                { metric: 'Total Certifications', value: certStats.total_certifications || 0, status: certStats.total_certifications > 0 ? 'active' : 'empty' },
                { metric: 'Active Learners', value: engagementStats.active_learners || 0, status: engagementStats.active_learners > 0 ? 'active' : 'empty' }
              ] || []).map((row, index) => (
                <motion.tr key={row.metric}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{row.metric}</td>
                  <td className="py-3 px-4 text-right text-slate-700 font-semibold">{row.value}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'active' || row.status === 'good'
                      ? 'bg-green-100 text-green-700'
                      : row.status === 'needs_attention'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                      }`}>
                      {row.status === 'active' ? '● Active' :
                        row.status === 'good' ? '● Good' :
                          row.status === 'needs_attention' ? '⚠ Needs Attention' :
                            '○ Empty'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Data Quality Note */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
        className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Live Data</h4>
            <p className="text-sm text-blue-700">
              All metrics on this dashboard are fetched live from the database.
              As more users register and enroll in courses, these numbers will update automatically.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PolicymakerDashboard;
