import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, BookOpen, Bot, Shield, LayoutDashboard,
  Save, Lock, Download, CheckCircle, AlertTriangle, Loader2,
  X, Camera, ChevronRight, Sun, Moon, Monitor, Eye, EyeOff,
  Mail, Globe, Github, Linkedin, Tag, Clock
} from 'lucide-react';
import apiClient from '../utils/api';

// ─────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
    className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-semibold max-w-sm
      ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}
  >
    {type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
    <span className="text-sm">{msg}</span>
    <button onClick={onClose} className="ml-auto"><X className="w-4 h-4" /></button>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// Shared UI primitives
// ─────────────────────────────────────────────────────────
const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', hint = '' }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
    <input
      type={type} value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
    />
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
  </div>
);

const FormTextarea = ({ label, value, onChange, placeholder = '', rows = 3 }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
    <textarea
      value={value || ''} placeholder={placeholder} rows={rows}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
    />
  </div>
);

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${checked ? 'bg-primary-600' : 'bg-slate-300'}`}
    >
      <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const SelectRow = ({ label, value, onChange, options }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <p className="text-sm font-semibold text-slate-800">{label}</p>
    <select
      value={value || ''} onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const SectionCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, color = 'bg-primary-600' }) => (
  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
  </div>
);

const SaveButton = ({ onSave, saving, label = 'Save Changes' }) => (
  <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
    <button
      onClick={onSave} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition disabled:opacity-60"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Saving...' : label}
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────
// SIDEBAR NAV ITEMS
// ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'profile',       label: 'Profile & Identity',        icon: User,          color: 'bg-blue-600' },
  { id: 'notifications', label: 'Notification Preferences',  icon: Bell,          color: 'bg-amber-500' },
  { id: 'teaching',      label: 'Teaching Preferences',      icon: BookOpen,      color: 'bg-emerald-600' },
  { id: 'ai',            label: 'AI Buddy Config',           icon: Bot,           color: 'bg-purple-600' },
  { id: 'privacy',       label: 'Privacy & Security',        icon: Shield,        color: 'bg-red-600' },
  { id: 'dashboard',     label: 'Dashboard Customization',   icon: LayoutDashboard, color: 'bg-indigo-600' },
];

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const TrainerSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);

  // Password change state
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrainerSettings();
      if (res.success) setSettings(res.data);
    } catch (e) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateSection = (section, key, val) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: val } }));
  };

  const saveSection = async (section, apiCall) => {
    setSaving(prev => ({ ...prev, [section]: true }));
    try {
      const res = await apiCall(settings[section]);
      if (res.success) showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved!`);
      else showToast(res.message || 'Save failed', 'error');
    } catch (e) {
      showToast(e?.message || 'Failed to save', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwData.new_password !== pwData.confirm) { setPwError("New passwords don't match."); return; }
    if (pwData.new_password.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setSaving(prev => ({ ...prev, password: true }));
    try {
      const res = await apiClient.changePassword({ current_password: pwData.current_password, new_password: pwData.new_password });
      if (res.success) {
        showToast('Password changed successfully!');
        setPwData({ current_password: '', new_password: '', confirm: '' });
      } else {
        setPwError(res.detail || res.message || 'Incorrect current password.');
      }
    } catch (e) {
      setPwError(e?.message || 'Failed to change password.');
    } finally {
      setSaving(prev => ({ ...prev, password: false }));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiClient.exportTrainerData();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `trainer_data_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click(); URL.revokeObjectURL(url);
        showToast('Data exported successfully!');
      }
    } catch (e) {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      <p className="text-slate-500 text-sm">Loading settings...</p>
    </div>
  );

  if (!settings) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-red-500">Failed to load settings. Please refresh.</p>
    </div>
  );

  const s = settings;

  return (
    <div className="flex h-full min-h-screen bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 space-y-1 hidden md:block">
        <div className="px-3 pb-4 mb-2 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your trainer preferences</p>
        </div>
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left
              ${activeSection === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <div className={`w-7 h-7 ${activeSection === item.id ? item.color : 'bg-slate-200'} rounded-lg flex items-center justify-center transition-colors`}>
              <item.icon className="w-3.5 h-3.5 text-white" />
            </div>
            {item.label}
          </button>
        ))}
      </aside>

      {/* ── Mobile Tab Nav ────────────────────────────────────── */}
      <div className="md:hidden w-full absolute top-0 left-0 bg-white border-b border-slate-200 flex overflow-x-auto gap-2 px-4 py-2 z-20">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition
              ${activeSection === item.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            <item.icon className="w-3 h-3" />
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-16 md:pt-8 space-y-6 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >

            {/* ══ PROFILE & IDENTITY ══════════════════════════════ */}
            {activeSection === 'profile' && (
              <SectionCard>
                <SectionHeader icon={User} title="Profile & Identity" color="bg-blue-600" />
                <div className="p-6 space-y-4">
                  {/* Avatar placeholder */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                      {(s.profile?.name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{s.profile?.name || 'Your Name'}</p>
                      <p className="text-sm text-slate-500">{s.profile?.email || ''}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.profile?.designation || 'Trainer'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Full Name" value={s.profile?.name} onChange={v => updateSection('profile', 'name', v)} placeholder="John Doe" />
                    <FormInput label="Designation" value={s.profile?.designation} onChange={v => updateSection('profile', 'designation', v)} placeholder="Senior Trainer" />
                    <FormInput label="Organization" value={s.profile?.organization} onChange={v => updateSection('profile', 'organization', v)} placeholder="NSQF Institute" />
                  </div>
                  <FormTextarea label="Bio" value={s.profile?.bio} onChange={v => updateSection('profile', 'bio', v)} placeholder="Tell learners about yourself..." />

                  {/* Expertise Tags */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Expertise Tags</label>
                    <input
                      type="text"
                      value={(s.profile?.expertise_tags || []).join(', ')}
                      onChange={e => updateSection('profile', 'expertise_tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                      placeholder="Python, Data Science, Web Development (comma-separated)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput label="LinkedIn" value={s.profile?.linkedin} onChange={v => updateSection('profile', 'linkedin', v)} placeholder="linkedin.com/in/..." />
                    <FormInput label="GitHub" value={s.profile?.github} onChange={v => updateSection('profile', 'github', v)} placeholder="github.com/..." />
                    <FormInput label="Portfolio" value={s.profile?.portfolio} onChange={v => updateSection('profile', 'portfolio', v)} placeholder="yoursite.com" />
                  </div>
                </div>
                <SaveButton onSave={() => saveSection('profile', apiClient.updateProfileSettings.bind(apiClient))} saving={saving.profile} />
              </SectionCard>
            )}

            {/* ══ NOTIFICATIONS ════════════════════════════════════ */}
            {activeSection === 'notifications' && (
              <SectionCard>
                <SectionHeader icon={Bell} title="Notification Preferences" color="bg-amber-500" />
                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Email Alerts</p>
                  <ToggleRow label="New Enrollment" description="Get notified when a learner enrolls in your course" checked={s.notifications?.email_new_enrollment} onChange={v => updateSection('notifications', 'email_new_enrollment', v)} />
                  <ToggleRow label="Assignment Submitted" description="Get an email when a learner submits an assignment" checked={s.notifications?.email_assignment_submitted} onChange={v => updateSection('notifications', 'email_assignment_submitted', v)} />
                  <ToggleRow label="Assessment Completed" description="Notify when a learner completes an assessment" checked={s.notifications?.email_assessment_completed} onChange={v => updateSection('notifications', 'email_assessment_completed', v)} />

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-3">In-App Alerts</p>
                  <ToggleRow label="Course Activity" description="Show in-app alerts for course engagement events" checked={s.notifications?.inapp_course_activity} onChange={v => updateSection('notifications', 'inapp_course_activity', v)} />
                  <ToggleRow label="At-Risk Student Alerts" description="Notify when students show low engagement" checked={s.notifications?.inapp_at_risk_alerts} onChange={v => updateSection('notifications', 'inapp_at_risk_alerts', v)} />

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-1">Digest Frequency</p>
                  <SelectRow
                    label="Activity Summary"
                    value={s.notifications?.digest_frequency}
                    onChange={v => updateSection('notifications', 'digest_frequency', v)}
                    options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'never', label: 'Never' }]}
                  />
                </div>
                <SaveButton onSave={() => saveSection('notifications', apiClient.updateNotificationSettings.bind(apiClient))} saving={saving.notifications} />
              </SectionCard>
            )}

            {/* ══ TEACHING PREFERENCES ═════════════════════════════ */}
            {activeSection === 'teaching' && (
              <SectionCard>
                <SectionHeader icon={BookOpen} title="Teaching Preferences" color="bg-emerald-600" />
                <div className="px-6 py-4 space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Course Defaults</p>
                  <SelectRow label="Default NSQF Level" value={String(s.teaching?.default_nsqf_level)} onChange={v => updateSection('teaching', 'default_nsqf_level', Number(v))}
                    options={[1,2,3,4,5,6,7,8,9,10].map(l => ({ value: String(l), label: `Level ${l}` }))} />
                  <SelectRow label="Default Difficulty" value={s.teaching?.default_difficulty} onChange={v => updateSection('teaching', 'default_difficulty', v)}
                    options={['Beginner','Intermediate','Advanced'].map(d => ({ value: d, label: d }))} />
                  <SelectRow label="Default Course Status" value={s.teaching?.default_course_status} onChange={v => updateSection('teaching', 'default_course_status', v)}
                    options={[{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }]} />

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-3">Assessment Defaults</p>
                  <div className="grid grid-cols-2 gap-4 pb-3">
                    <FormInput label="Passing Score (%)" type="number" value={s.teaching?.default_passing_score} onChange={v => updateSection('teaching', 'default_passing_score', Number(v))} />
                    <FormInput label="Max Retakes" type="number" value={s.teaching?.default_retake_limit} onChange={v => updateSection('teaching', 'default_retake_limit', Number(v))} />
                    <FormInput label="Time Limit (mins)" type="number" value={s.teaching?.default_time_limit} onChange={v => updateSection('teaching', 'default_time_limit', Number(v))} />
                  </div>

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-3">Course Behaviour</p>
                  <ToggleRow label="Auto-Issue Certificates" description="Auto-generate certificate when a learner reaches 100% completion" checked={s.teaching?.auto_certificate} onChange={v => updateSection('teaching', 'auto_certificate', v)} />
                  <SelectRow label="Grading Style" value={s.teaching?.grading_style} onChange={v => updateSection('teaching', 'grading_style', v)}
                    options={[{ value: 'auto', label: 'Auto-grade (MCQ)' }, { value: 'manual', label: 'Manual Review' }]} />
                </div>
                <SaveButton onSave={() => saveSection('teaching', apiClient.updateTeachingSettings.bind(apiClient))} saving={saving.teaching} />
              </SectionCard>
            )}

            {/* ══ AI BUDDY CONFIG ═══════════════════════════════════ */}
            {activeSection === 'ai' && (
              <SectionCard>
                <SectionHeader icon={Bot} title="AI Buddy Configuration" color="bg-purple-600" />
                <div className="px-6 py-4">
                  {/* Tone preview pills */}
                  <div className="mb-5">
                    <p className="text-sm font-bold text-slate-800 mb-2">AI Response Tone</p>
                    <p className="text-xs text-slate-500 mb-3">Controls how AI Buddy interacts with your learners</p>
                    <div className="flex gap-3 flex-wrap">
                      {['formal', 'friendly', 'motivational'].map(tone => (
                        <button
                          key={tone}
                          onClick={() => updateSection('ai', 'ai_tone', tone)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition capitalize
                            ${s.ai?.ai_tone === tone ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          {tone === 'formal' ? '🎓 Formal' : tone === 'friendly' ? '😊 Friendly' : '🚀 Motivational'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SelectRow label="AI Insights Frequency" value={s.ai?.ai_insights_frequency} onChange={v => updateSection('ai', 'ai_insights_frequency', v)}
                    options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'manual', label: 'Only when I request' }]} />
                  <ToggleRow label="AI Question Generation" description="Allow AI Buddy to assist in creating assessment questions" checked={s.ai?.ai_question_generation} onChange={v => updateSection('ai', 'ai_question_generation', v)} />
                </div>
                <SaveButton onSave={() => saveSection('ai', apiClient.updateAISettings.bind(apiClient))} saving={saving.ai} />
              </SectionCard>
            )}

            {/* ══ PRIVACY & SECURITY ════════════════════════════════ */}
            {activeSection === 'privacy' && (
              <div className="space-y-5">
                {/* 2FA */}
                <SectionCard>
                  <SectionHeader icon={Shield} title="Privacy & Security" color="bg-red-600" />
                  <div className="px-6 py-4">
                    <ToggleRow
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account (email OTP)"
                      checked={s.privacy?.two_factor_enabled}
                      onChange={v => updateSection('privacy', 'two_factor_enabled', v)}
                    />
                  </div>
                  <SaveButton onSave={() => saveSection('privacy', apiClient.updatePrivacySettings.bind(apiClient))} saving={saving.privacy} />
                </SectionCard>

                {/* Change Password */}
                <SectionCard>
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                    <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {pwError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />{pwError}
                      </div>
                    )}
                    {['current', 'new', 'confirm'].map(field => (
                      <div key={field}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          {field === 'current' ? 'Current Password' : field === 'new' ? 'New Password' : 'Confirm New Password'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPw[field] ? 'text' : 'password'}
                            value={pwData[field === 'confirm' ? 'confirm' : `${field}_password`] || ''}
                            onChange={e => setPwData(prev => ({ ...prev, [field === 'confirm' ? 'confirm' : `${field}_password`]: e.target.value }))}
                            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder={field === 'current' ? 'Enter current password' : 'At least 8 characters'}
                          />
                          <button type="button" onClick={() => setShowPw(prev => ({ ...prev, [field]: !prev[field] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <button
                      onClick={handleChangePassword} disabled={saving.password}
                      className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-60"
                    >
                      {saving.password ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {saving.password ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </SectionCard>

                {/* Data Export */}
                <SectionCard>
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Data Export</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-slate-600 mb-4">
                      Download all your data including courses, student records, and assessment results as a JSON file.
                    </p>
                    <button
                      onClick={handleExport} disabled={exporting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {exporting ? 'Exporting...' : 'Export My Data'}
                    </button>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ══ DASHBOARD CUSTOMIZATION ════════════════════════════ */}
            {activeSection === 'dashboard' && (
              <SectionCard>
                <SectionHeader icon={LayoutDashboard} title="Dashboard Customization" color="bg-indigo-600" />
                <div className="px-6 py-4 space-y-4">
                  <SelectRow label="Default Analytics Period"
                    value={s.dashboard?.default_analytics_period}
                    onChange={v => updateSection('dashboard', 'default_analytics_period', v)}
                    options={[{ value: '7days', label: 'Last 7 Days' }, { value: '30days', label: 'Last 30 Days' }, { value: 'all', label: 'All Time' }]}
                  />

                  {/* Theme selector */}
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">Theme</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateSection('dashboard', 'theme', opt.value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition
                            ${s.dashboard?.theme === opt.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          <opt.icon className="w-5 h-5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pinned Metrics */}
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">Pinned Metrics</p>
                    <p className="text-xs text-slate-500 mb-3">Choose which stats appear prominently on your dashboard</p>
                    <div className="flex flex-wrap gap-2">
                      {['Total Courses', 'Total Students', 'Completion Rate', 'Avg Score', 'Active Learners', 'At-Risk Students'].map(metric => {
                        const selected = (s.dashboard?.pinned_metrics || []).includes(metric);
                        return (
                          <button
                            key={metric}
                            onClick={() => {
                              const current = s.dashboard?.pinned_metrics || [];
                              const updated = selected ? current.filter(m => m !== metric) : [...current, metric];
                              updateSection('dashboard', 'pinned_metrics', updated);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition
                              ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                          >
                            {selected ? '✓ ' : ''}{metric}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <SaveButton onSave={() => saveSection('dashboard', apiClient.updateDashboardSettings.bind(apiClient))} saving={saving.dashboard} />
              </SectionCard>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default TrainerSettings;
