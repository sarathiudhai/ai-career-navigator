import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, AlertTriangle, Loader2, RefreshCw, Target,
  ChevronDown, ChevronUp, Lightbulb, BarChart3, BookOpen, ShieldAlert
} from 'lucide-react';
import apiClient from '../utils/api';

const PolicymakerSkillGaps = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDomain, setExpandedDomain] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { setLoading(true); setError(null);
      const res = await apiClient.getSkillGapAnalysis();
      if (res.success) setData(res.data);
      else setError('Failed to load skill gap analysis');
    } catch (e) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /><span className="text-slate-500">Analyzing skill gaps...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><AlertTriangle className="w-12 h-12 text-red-400" /><p className="text-red-600">{error}</p><button onClick={fetchData} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold">Retry</button></div>;

  const missing = data?.top_missing_skills || [];
  const domainGaps = data?.domain_gaps || [];
  const nsqfGaps = data?.nsqf_level_gaps || [];
  const recs = data?.recommendations || [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Skill Gap Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">Identify mismatches between learner skills and industry demand</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl border border-red-100 p-5">
          <ShieldAlert className="w-8 h-8 text-red-500 mb-3" />
          <p className="text-3xl font-black text-slate-900">{missing.length}</p>
          <p className="text-sm font-semibold text-slate-700">Skill Gaps Identified</p>
          <p className="text-xs text-slate-500 mt-0.5">Skills taught in courses but missing from learner profiles</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-5">
          <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
          <p className="text-3xl font-black text-slate-900">{data?.total_courses_analyzed || 0}</p>
          <p className="text-sm font-semibold text-slate-700">Courses Analyzed</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border border-emerald-100 p-5">
          <Target className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-3xl font-black text-slate-900">{data?.total_learners_analyzed || 0}</p>
          <p className="text-sm font-semibold text-slate-700">Learners Analyzed</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Missing Skills */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-900">Top Missing Skills</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {missing.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">No skill gaps detected yet.</p>
            ) : missing.slice(0, 12).map((s, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i < 3 ? 'bg-red-500' : i < 6 ? 'bg-amber-500' : 'bg-slate-400'}`}>{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-800 capitalize">{s.skill}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-bold">{s.courses_teaching} courses</span>
                  <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold">{s.learners_with_skill} learners</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* NSQF Level-Wise Gaps */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">NSQF Level-Wise Skill Gaps</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {nsqfGaps.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-400">No level-wise gap data yet.</p>
            ) : nsqfGaps.map((g, i) => (
              <div key={i} className="px-6 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">Level {g.level}</span>
                  <span className="text-xs text-slate-400">{g.top_missing.length} missing skills</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {g.top_missing.map((sk, j) => (
                    <span key={j} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-xs font-medium capitalize">{sk.skill} ({sk.count})</span>
                  ))}
                  {g.top_missing.length === 0 && <span className="text-xs text-slate-400">No gaps identified</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Domain-Wise Gap Analysis */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Domain-Wise Skill Coverage</h2>
        </div>
        {domainGaps.length === 0 ? (
          <p className="text-center py-10 text-sm text-slate-400">No domain data available.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {domainGaps.map((d, i) => (
              <div key={i} className="hover:bg-slate-50 transition">
                <button onClick={() => setExpandedDomain(expandedDomain === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-bold text-slate-900">{d.domain}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs text-slate-600">{d.learner_count} learners</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full ${d.coverage_pct >= 80 ? 'bg-emerald-500' : d.coverage_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.coverage_pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${d.coverage_pct >= 80 ? 'text-emerald-600' : d.coverage_pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{d.coverage_pct}%</span>
                    </div>
                    {expandedDomain === i ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {expandedDomain === i && d.gap_skills.length > 0 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {d.gap_skills.map((sk, j) => (
                        <span key={j} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-xl text-xs font-semibold capitalize">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Recommendations */}
      {recs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center"><Lightbulb className="w-5 h-5 text-white" /></div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900">AI Recommendations</h2>
              <p className="text-xs text-indigo-600">Suggested actions to close identified gaps</p>
            </div>
          </div>
          <div className="space-y-3">
            {recs.map((r, i) => (
              <div key={i} className="bg-white/70 rounded-2xl p-4 border border-indigo-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PolicymakerSkillGaps;
