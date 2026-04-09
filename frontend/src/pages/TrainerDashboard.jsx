import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Activity,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../utils/api';

const TrainerDashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // We can use the advanced analytics endpoint to get the overview stats
      const res = await apiClient.getTrainerAnalytics('all', '');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  const overview = data?.overview || { total_courses: 0, total_learners: 0, active_learners: 0, avg_assessment_score: 0 };
  const courses = data?.course_performance || [];
  const atRisk = data?.at_risk_students || [];

  return (
    <div className="p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="glass p-8 rounded-3xl border border-white/40 shadow-sm relative overflow-hidden bg-gradient-to-r from-primary-600 to-indigo-700 text-white">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, Trainer!</h1>
            <p className="text-primary-100 max-w-lg text-lg">
              Manage your courses, track student progress, and utilize AI-driven insights to improve your teaching outcomes.
            </p>
          </div>
          <Link to="/courses" className="px-6 py-3 bg-white text-primary-700 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm flex items-center gap-2">
            Manage Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">Quick Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: BookOpen, label: "Total Courses", value: overview.total_courses, color: "bg-blue-100 text-blue-600" },
          { icon: Users, label: "Total Students", value: overview.total_learners, color: "bg-emerald-100 text-emerald-600" },
          { icon: Activity, label: "Active Enrollments", value: overview.active_learners, color: "bg-amber-100 text-amber-600" },
          { icon: CheckCircle, label: "Avg Score", value: `${overview.avg_assessment_score}%`, color: "bg-purple-100 text-purple-600" }
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Courses List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Your Active Courses</h3>
            <Link to="/courses" className="text-sm font-semibold text-primary-600 hover:text-primary-700">View All</Link>
          </div>
          <div className="p-6">
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 4).map((course, idx) => (
                  <div key={course.course_id || idx} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{course.name}</h4>
                        <p className="text-sm text-slate-500">{course.enrollments} Enrolled</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{course.completion_rate}% Comp.</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">No courses available. Start by creating one!</p>
            )}
          </div>
        </div>

        {/* Action Items / Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Action Needed</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {atRisk.length > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <h4 className="font-bold text-red-800 text-sm mb-1">At-Risk Students Alert</h4>
                  <p className="text-xs text-red-600">You have {atRisk.length} students who haven't logged in recently or are falling behind.</p>
                  <Link to="/analytics" className="mt-3 inline-block text-xs font-bold text-red-700 underline">View in Analytics</Link>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-900">All Good!</h4>
                <p className="text-sm text-slate-500 mt-2 max-w-[200px]">No urgent actions required at this time.</p>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100">
              <Link to="/analytics" className="w-full py-3 bg-slate-50 rounded-xl border border-slate-200 text-center font-semibold text-slate-700 hover:bg-slate-100 transition block">
                Go to Analytics Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
