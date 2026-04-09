import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, Loader2, RefreshCw, Trophy, UserX,
  GraduationCap, BarChart3, Award, Target, TrendingDown
} from 'lucide-react';
import apiClient from '../utils/api';

const PolicymakerUserInsights = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { setLoading(true); setError(null);
      const res = await apiClient.getUserInsights();
      if (res.success) setData(res.data);
      else setError('Failed to load user insights');
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /><span className="text-slate-500">Analyzing user data...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><AlertTriangle className="w-12 h-12 text-red-400" /><p className="text-red-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold">Retry</button></div>;

  const demo = data?.demographics || {};
  const funnel = data?.funnel || {};
  const atRisk = data?.at_risk_learners || [];
  const leaderboard = data?.leaderboard || [];
  const ageGroups = demo.age_groups || {};

  const funnelSteps = [
    { label: 'Registered', value: funnel.registered || 0, color: 'bg-blue-500' },
    { label: 'Profile Done', value: funnel.profile_completed || 0, color: 'bg-indigo-500' },
    { label: 'Enrolled', value: funnel.enrolled || 0, color: 'bg-purple-500' },
    { label: 'Active', value: funnel.active || 0, color: 'bg-amber-500' },
    { label: 'Completed', value: funnel.completed || 0, color: 'bg-emerald-500' },
    { label: 'Certified', value: funnel.certified || 0, color: 'bg-green-600' },
  ];
  const maxFunnel = Math.max(...funnelSteps.map(s => s.value), 1);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">User Insights</h1>
          <p className="text-sm text-slate-500 mt-1">Deep understanding of learner and trainer behavior patterns</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Learning Funnel */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Target className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">Learner Journey Funnel</h2>
        </div>
        <div className="flex flex-col items-center gap-1">
          {funnelSteps.map((step, i) => {
            const widthPct = Math.max((step.value / maxFunnel) * 100, 20);
            const dropOff = i > 0 && funnelSteps[i - 1].value > 0
              ? Math.round(((funnelSteps[i - 1].value - step.value) / funnelSteps[i - 1].value) * 100) : 0;
            return (
              <motion.div key={step.label} initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-3 w-full" style={{ maxWidth: `${widthPct}%`, minWidth: '200px' }}>
                <div className={`flex-1 ${step.color} rounded-xl py-3 px-4 text-white flex items-center justify-between`}>
                  <span className="text-sm font-bold">{step.label}</span>
                  <span className="text-lg font-black">{step.value}</span>
                </div>
                {dropOff > 0 && (
                  <span className="text-xs font-bold text-red-500 flex items-center gap-0.5 flex-shrink-0">
                    <TrendingDown className="w-3 h-3" />-{dropOff}%
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Demographics: Age */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Age Distribution</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(ageGroups).map(([group, count]) => {
              const max = Math.max(...Object.values(ageGroups).map(Number), 1);
              return (
                <div key={group} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600 w-16">{group}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div className="h-4 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Demographics: Career Aspirations */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Career Aspirations</h2>
          </div>
          {(demo.career_aspirations || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No career data yet.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {(demo.career_aspirations || []).slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{c.name}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Top Performing Learners</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {leaderboard.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">No learner data yet.</p>
            ) : leaderboard.slice(0, 10).map((l, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50 transition">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-300'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{l.name}</p>
                  <p className="text-xs text-slate-500">{l.domain} · NSQF {l.nsqf_level}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{l.progress}%</p>
                  <p className="text-xs text-slate-400">{l.courses_completed} completed</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* At-Risk Learners */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-red-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-50 flex items-center gap-2 bg-red-50/50">
            <UserX className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-red-900">At-Risk Learners</h2>
            {atRisk.length > 0 && <span className="ml-auto bg-red-100 text-red-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{atRisk.length}</span>}
          </div>
          <div className="divide-y divide-red-50 max-h-80 overflow-y-auto">
            {atRisk.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">No at-risk learners. Great!</p>
            ) : atRisk.slice(0, 10).map((l, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-red-50/30 transition">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{l.name}</p>
                  <p className="text-xs text-slate-500">{l.domain} · {l.courses_enrolled} courses</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-red-600">{l.progress}%</p>
                  <p className="text-xs text-slate-400">NSQF {l.nsqf_level}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Education & Experience */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" />Education Background</h2>
          {(demo.education || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {(demo.education || []).slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-sm text-slate-700">{e.name}</span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-purple-500" />Experience Levels</h2>
          {(demo.experience || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {(demo.experience || []).slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-sm text-slate-700">{e.name}</span>
                  <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Note */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-blue-50 rounded-3xl border border-blue-100 p-5 flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold text-blue-900 text-sm">Learning Pace</p>
          <p className="text-sm text-blue-700">Average course progress across all learners: <strong>{data?.average_learning_pace || 0}%</strong></p>
        </div>
      </motion.div>
    </div>
  );
};

export default PolicymakerUserInsights;
