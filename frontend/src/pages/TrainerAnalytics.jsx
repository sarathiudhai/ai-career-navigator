import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
  Clock,
  Star,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Filter,
  FileText,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import apiClient from '../utils/api';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TrainerAnalytics = () => {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [aiInsights, setAiInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const [filters, setFilters] = useState({
    timeRange: 'all',
    courseId: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      const res = await apiClient.getTrainerCourses();
      if (res.success) setCourses(res.data.courses || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrainerAnalytics(filters.timeRange, filters.courseId);
      if (res.success && res.data) {
        setData(res.data);
        generateAIInsights(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (analyticsData) => {
    try {
      setAiLoading(true);
      // Construct a lightweight payload for the AI
      const payload = {
        overview: analyticsData.overview,
        course_performance: analyticsData.course_performance,
        top_domains: analyticsData.top_domains
      };

      const res = await apiClient.getTrainerAIInsights(payload);
      if (res.success && res.data?.insights) {
        setAiInsights(res.data.insights);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data || !data.student_leaderboard) return;

    const headers = ["Student Name", "Domain", "NSQF Level", "Avg Progress %", "Last Active"];
    const rows = [...data.student_leaderboard, ...data.at_risk_students].map(s =>
      [s.name, s.domain, s.nsqf, s.progress, s.last_active || "Never"]
    );

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trainer_student_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  // Prep Chart Data
  const coursePerformanceData = data?.course_performance || [];
  const topDomainsData = data?.top_domains || [];

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">

      {/* Header & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Overview</h1>
          <p className="text-slate-500">Track course engagement, student performance, and growth metrics.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm font-medium">
            <FileText className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Global Filters */}
      <div className="glass p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Filter className="w-5 h-5" /> <span>Filters:</span>
        </div>
        <select
          value={filters.timeRange}
          onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="90d">Last 90 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
        <select
          value={filters.courseId}
          onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm min-w-[200px]"
        >
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}
        </select>
      </div>

      {/* AI Insight Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Star className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Star className="w-7 h-7 text-indigo-300" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-2">AI Trainer Insights</h2>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-indigo-200">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your metrics via Groq Llama-3...
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-indigo-50 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {aiInsights || "No insights could be generated at this time."}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: BookOpen, label: "Active Courses", value: data?.overview?.total_courses || 0, color: "bg-blue-100 text-blue-600" },
          { icon: Users, label: "Total Enrollments", value: data?.overview?.total_learners || 0, color: "bg-emerald-100 text-emerald-600" },
          { icon: Activity, label: "Active Learners", value: data?.overview?.active_learners || 0, color: "bg-amber-100 text-amber-600" },
          { icon: CheckCircle, label: "Avg Assessment Score", value: `${data?.overview?.avg_assessment_score || 0}%`, color: "bg-purple-100 text-purple-600" }
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Course Completion Comparisons */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Course Completion Rates</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformanceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="completion_rate" name="Completion Rate %" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Domains Pipeline */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Learned Domains</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {topDomainsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topDomainsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                  >
                    {topDomainsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">No domain demographic data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement & Dropout Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Performers */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Student Leaderboard</h3>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Top Performers</span>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Name</th>
                  <th className="px-6 py-3">NSQF Level</th>
                  <th className="px-6 py-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.student_leaderboard || []).map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs">Level {student.nsqf}</span></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-emerald-600">{student.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.student_leaderboard || data?.student_leaderboard.length === 0) && (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No student data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">At-Risk Learners</h3>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dropout Warning</span>
          </div>
          <div className="flex-1 p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Name</th>
                  <th className="px-6 py-3">Last Active</th>
                  <th className="px-6 py-3 text-right border-r border-slate-100">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.at_risk_students || []).map((student, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                    <td className="px-6 py-4 text-slate-500">{student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-4 text-right border-r border-slate-100">
                      <span className="font-bold text-red-600">{student.progress}%</span>
                    </td>
                  </tr>
                ))}
                {(!data?.at_risk_students || data?.at_risk_students.length === 0) && (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No students are currently marked at-risk!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TrainerAnalytics;
