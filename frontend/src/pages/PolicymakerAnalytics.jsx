import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, BookOpen, Award, TrendingUp, Target,
  Loader2, AlertTriangle, RefreshCw, GraduationCap
} from 'lucide-react';
import apiClient from '../utils/api';

const PolicymakerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const res = await apiClient.getSystemAnalytics();
      if (res.success) setData(res.data);
      else setError('Failed to load analytics');
    } catch (e) { setError('Failed to load analytics data'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      <span className="text-slate-500">Loading analytics...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="w-12 h-12 text-red-400" />
      <p className="text-red-600">{error}</p>
      <button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold">Retry</button>
    </div>
  );

  const us = data?.user_statistics || {};
  const cs = data?.course_statistics || {};
  const cert = data?.certification_statistics || {};
  const eng = data?.engagement_metrics || {};
  const nsqfCourses = data?.nsqf_distribution_courses || {};
  const nsqfLearners = data?.nsqf_distribution_learners || {};
  const domains = data?.domain_enrollment || [];
  const trainers = data?.trainer_rankings || [];

  const cards = [
    { label: 'Total Users', value: us.total_users || 0, icon: Users, color: 'bg-blue-600', sub: `${us.learners || 0} learners, ${us.trainers || 0} trainers` },
    { label: 'Total Courses', value: cs.total_courses || 0, icon: BookOpen, color: 'bg-emerald-600', sub: `${cs.total_enrollments || 0} enrollments` },
    { label: 'Completion Rate', value: `${cs.average_completion_rate || 0}%`, icon: Target, color: 'bg-amber-500', sub: 'Average across all courses' },
    { label: 'Certifications', value: cert.total_certifications || 0, icon: Award, color: 'bg-purple-600', sub: `${eng.active_learners || 0} active learners` },
  ];

  const maxNsqf = Math.max(...Object.values(nsqfLearners).map(Number), 1);
  const maxDomain = Math.max(...domains.map(d => d.count), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">System-wide performance metrics across the NSQF ecosystem</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-3xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
            <div className={`w-11 h-11 ${c.color} rounded-2xl flex items-center justify-center mb-4`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-black text-slate-900">{c.value}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">{c.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* NSQF Level Distribution - Learners */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">NSQF Level Distribution — Learners</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(nsqfLearners).map(([level, count]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 w-12">Lvl {level}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(Number(count) / maxNsqf) * 100}%` }}
                    transition={{ duration: 0.8, delay: Number(level) * 0.05 }}
                    className="h-5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />
                </div>
                <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Domain Enrollment */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Domain-wise Course Distribution</h2>
          </div>
          {domains.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No domain data available yet.</p>
          ) : (
            <div className="space-y-3">
              {domains.slice(0, 8).map((d, i) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'];
                return (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-28 truncate">{d.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(d.count / maxDomain) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.06 }}
                        className={`h-4 rounded-full ${colors[i % colors.length]}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-6 text-right">{d.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Trainer Rankings */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Top Trainer Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Rank</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Trainer</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Courses</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Students</th>
              </tr>
            </thead>
            <tbody>
              {trainers.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-400">No trainer data yet.</td></tr>
              ) : trainers.map((t, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-3">
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{t.name}</td>
                  <td className="px-6 py-3 text-center"><span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">{t.courses}</span></td>
                  <td className="px-6 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold">{t.students}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Role Distribution */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">User Distribution by Role</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Learners', value: us.learners || 0, pct: us.total_users ? Math.round((us.learners / us.total_users) * 100) : 0, color: 'bg-blue-500' },
            { label: 'Trainers', value: us.trainers || 0, pct: us.total_users ? Math.round((us.trainers / us.total_users) * 100) : 0, color: 'bg-emerald-500' },
            { label: 'Policymakers', value: us.policymakers || 0, pct: us.total_users ? Math.round((us.policymakers / us.total_users) * 100) : 0, color: 'bg-amber-500' },
          ].map(r => (
            <div key={r.label} className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-900">{r.value}</p>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">{r.label}</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{r.pct}%</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default PolicymakerAnalytics;
