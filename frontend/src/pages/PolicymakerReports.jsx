import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Loader2, AlertTriangle, RefreshCw,
  CheckCircle, Award, Users, BookOpen, Shield, Clock, X,
  BarChart3, Printer
} from 'lucide-react';
import apiClient from '../utils/api';

const Toast = ({ msg, type, onClose }) => (
  <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
    className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold max-w-sm ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
    {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
    <span className="text-sm">{msg}</span>
    <button onClick={onClose}><X className="w-4 h-4" /></button>
  </motion.div>
);

const PolicymakerReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchReport(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const fetchReport = async () => {
    try { setLoading(true); setError(null);
      const res = await apiClient.getSystemSummaryReport();
      if (res.success) setReport(res.data);
      else setError('Failed to load report');
    } catch (e) { setError('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const res = await apiClient.exportAllPlatformData();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `platform_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        showToast('Full platform data exported!');
      }
    } catch (e) { showToast('Export failed', 'error'); }
    finally { setExporting(false); }
  };

  const handleExportSummary = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `system_summary_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Summary report downloaded!');
  };

  const handlePrint = () => { window.print(); };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /><span className="text-slate-500">Generating reports...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><AlertTriangle className="w-12 h-12 text-red-400" /><p className="text-red-600">{error}</p><button onClick={fetchReport} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold">Retry</button></div>;

  const summary = report?.summary || {};
  const certs = report?.certifications || [];
  const trainers = report?.trainer_activity || [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Generate and download formal reports for stakeholders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCw className="w-4 h-4" /> Regenerate
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button onClick={handleExportSummary} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-left text-white hover:shadow-xl transition-shadow">
          <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold">Download Summary Report</h3>
          <p className="text-sm text-blue-200 mt-1">System overview with all key metrics, certifications & trainer activity</p>
        </motion.button>

        <motion.button onClick={handleExportJSON} disabled={exporting} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-left text-white hover:shadow-xl transition-shadow disabled:opacity-60">
          <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          </div>
          <h3 className="text-lg font-bold">{exporting ? 'Exporting...' : 'Export Full Platform Data'}</h3>
          <p className="text-sm text-emerald-200 mt-1">Download all learners, trainers, courses & certifications as JSON</p>
        </motion.button>
      </div>

      {/* System Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">System Summary</h2>
          </div>
          <span className="text-xs text-slate-400">Generated: {report?.generated_at ? new Date(report.generated_at).toLocaleString() : 'N/A'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-100">
          {[
            { label: 'Learners', value: summary.total_learners || 0, icon: Users, color: 'text-blue-600' },
            { label: 'Trainers', value: summary.total_trainers || 0, icon: Users, color: 'text-emerald-600' },
            { label: 'Courses', value: summary.total_courses || 0, icon: BookOpen, color: 'text-purple-600' },
            { label: 'Certifications', value: summary.total_certifications || 0, icon: Award, color: 'text-amber-600' },
            { label: 'NSQF Compliant', value: summary.nsqf_compliant_courses || 0, icon: Shield, color: 'text-indigo-600' },
            { label: 'Compliance %', value: `${summary.compliance_pct || 0}%`, icon: CheckCircle, color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 text-center">
              <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Certification Records */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">NSQF Certification Records</h2>
          <span className="ml-auto bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-lg text-xs font-bold">{certs.length} issued</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">#</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Learner</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Course</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">NSQF</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Issued Date</th>
              </tr>
            </thead>
            <tbody>
              {certs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 text-slate-400">No certifications issued yet.</td></tr>
              ) : certs.slice(0, 20).map((c, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{c.learner}</td>
                  <td className="px-6 py-3 text-slate-600">{c.course}</td>
                  <td className="px-6 py-3 text-center"><span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg text-xs font-bold">Lvl {c.nsqf_level}</span></td>
                  <td className="px-6 py-3 text-slate-500 text-xs">{c.issued_date ? new Date(c.issued_date).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Trainer Activity */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Trainer Activity Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Trainer</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Courses Published</th>
                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase">Total Students</th>
              </tr>
            </thead>
            <tbody>
              {trainers.length === 0 ? (
                <tr><td colSpan="3" className="text-center py-10 text-slate-400">No trainer activity data.</td></tr>
              ) : trainers.map((t, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50 transition">
                  <td className="px-6 py-3 font-semibold text-slate-900">{t.name}</td>
                  <td className="px-6 py-3 text-center"><span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">{t.courses_published}</span></td>
                  <td className="px-6 py-3 text-center"><span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold">{t.total_students}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
};

export default PolicymakerReports;
