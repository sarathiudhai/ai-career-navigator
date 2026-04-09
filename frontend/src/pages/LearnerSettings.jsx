import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, LayoutDashboard,
  Save, Lock, CheckCircle, AlertTriangle, Loader2,
  X, Eye, EyeOff, Sun, Moon, Monitor,
  Award, BookOpen, Target, Globe, Github, Linkedin
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
const FormInput = ({ label, value, onChange, type = 'text', placeholder = '', hint = '', disabled = false }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
    <input
      type={type} value={value || ''} placeholder={placeholder} disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
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
  { id: 'profile',       label: 'Profile & Links',            icon: User,            color: 'bg-blue-600' },
  { id: 'notifications', label: 'Notifications',              icon: Bell,            color: 'bg-amber-500' },
  { id: 'preferences',   label: 'Preferences',                icon: LayoutDashboard, color: 'bg-indigo-600' },
  { id: 'privacy',       label: 'Privacy & Security',         icon: Shield,          color: 'bg-red-600' },
];

// ─────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const LearnerSettings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);

  // Password change state
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getLearnerSettings();
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
      const res = await apiClient.learnerChangePassword({
        current_password: pwData.current_password,
        new_password: pwData.new_password
      });
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
          <p className="text-xs text-slate-500 mt-0.5">Manage your learner preferences</p>
        </div>

        {/* Stats Card */}
        {s.stats && (
          <div className="mx-2 mb-4 p-4 bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-700 uppercase tracking-wide">My Stats</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">NSQF Level</span>
                <span className="text-xs font-bold text-primary-700">{s.stats.nsqf_level || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Courses</span>
                <span className="text-xs font-bold text-slate-800">{s.stats.courses_enrolled}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Certifications</span>
                <span className="text-xs font-bold text-emerald-600">{s.stats.certifications}</span>
              </div>
              {s.stats.target_career && (
                <div className="flex justify-between">
                  <span className="text-xs text-slate-600">Career</span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{s.stats.target_career}</span>
                </div>
              )}
            </div>
          </div>
        )}

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

            {/* ══ PROFILE & LINKS ══════════════════════════════ */}
            {activeSection === 'profile' && (
              <SectionCard>
                <SectionHeader icon={User} title="Profile & Links" color="bg-blue-600" />
                <div className="p-6 space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                      {(s.profile?.name || 'L').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{s.profile?.name || 'Your Name'}</p>
                      <p className="text-sm text-slate-500">{s.profile?.email || ''}</p>
                      {s.stats?.target_career && (
                        <p className="text-xs text-primary-600 font-medium mt-0.5 flex items-center gap-1">
                          <Target className="w-3 h-3" />{s.stats.target_career}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Full Name" value={s.profile?.name} onChange={v => updateSection('profile', 'name', v)} placeholder="Your full name" />
                    <FormInput label="Phone" value={s.profile?.phone} onChange={v => updateSection('profile', 'phone', v)} placeholder="+91 98765 43210" />
                    <FormInput label="Email" value={s.profile?.email} disabled placeholder="" hint="Email cannot be changed" />
                  </div>
                  <FormTextarea label="Bio" value={s.profile?.bio} onChange={v => updateSection('profile', 'bio', v)} placeholder="Tell us about yourself, your goals, and interests..." />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput label="LinkedIn" value={s.profile?.linkedin} onChange={v => updateSection('profile', 'linkedin', v)} placeholder="linkedin.com/in/..." />
                    <FormInput label="GitHub" value={s.profile?.github} onChange={v => updateSection('profile', 'github', v)} placeholder="github.com/..." />
                    <FormInput label="Portfolio" value={s.profile?.portfolio} onChange={v => updateSection('profile', 'portfolio', v)} placeholder="yoursite.com" />
                  </div>
                </div>
                <SaveButton onSave={() => saveSection('profile', apiClient.updateLearnerProfile.bind(apiClient))} saving={saving.profile} />
              </SectionCard>
            )}

            {/* ══ NOTIFICATIONS ════════════════════════════════════ */}
            {activeSection === 'notifications' && (
              <SectionCard>
                <SectionHeader icon={Bell} title="Notification Preferences" color="bg-amber-500" />
                <div className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Email Notifications</p>
                  <ToggleRow label="Course Updates" description="Get notified about changes to your enrolled courses" checked={s.notifications?.email_course_updates} onChange={v => updateSection('notifications', 'email_course_updates', v)} />
                  <ToggleRow label="Assessment Results" description="Receive your assessment scores and feedback via email" checked={s.notifications?.email_assessment_results} onChange={v => updateSection('notifications', 'email_assessment_results', v)} />
                  <ToggleRow label="Certificate Issued" description="Get an email when a certificate is issued to you" checked={s.notifications?.email_certificate_issued} onChange={v => updateSection('notifications', 'email_certificate_issued', v)} />
                  <ToggleRow label="AI Recommendations" description="Receive personalized course and career recommendations" checked={s.notifications?.email_recommendations} onChange={v => updateSection('notifications', 'email_recommendations', v)} />

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-3">In-App Notifications</p>
                  <ToggleRow label="Progress Reminders" description="Get reminded to continue your learning progress" checked={s.notifications?.inapp_progress_reminders} onChange={v => updateSection('notifications', 'inapp_progress_reminders', v)} />
                  <ToggleRow label="New Course Alerts" description="Get notified when new courses matching your interests are available" checked={s.notifications?.inapp_new_courses} onChange={v => updateSection('notifications', 'inapp_new_courses', v)} />

                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-5 mb-1">Summary Digest</p>
                  <SelectRow
                    label="Activity Summary"
                    value={s.notifications?.digest_frequency}
                    onChange={v => updateSection('notifications', 'digest_frequency', v)}
                    options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'never', label: 'Never' }]}
                  />
                </div>
                <SaveButton onSave={() => saveSection('notifications', apiClient.updateLearnerNotifications.bind(apiClient))} saving={saving.notifications} />
              </SectionCard>
            )}

            {/* ══ PREFERENCES ═══════════════════════════════════════ */}
            {activeSection === 'preferences' && (
              <SectionCard>
                <SectionHeader icon={LayoutDashboard} title="Display Preferences" color="bg-indigo-600" />
                <div className="px-6 py-4 space-y-5">
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
                          onClick={() => updateSection('preferences', 'theme', opt.value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition
                            ${s.preferences?.theme === opt.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          <opt.icon className="w-5 h-5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Dashboard Options</p>
                    <ToggleRow
                      label="Show NSQF Badge"
                      description="Display your NSQF level badge on your profile and dashboard"
                      checked={s.preferences?.show_nsqf_badge}
                      onChange={v => updateSection('preferences', 'show_nsqf_badge', v)}
                    />
                    <ToggleRow
                      label="Show Progress on Dashboard"
                      description="Display course progress charts on the main dashboard"
                      checked={s.preferences?.show_progress_on_dashboard}
                      onChange={v => updateSection('preferences', 'show_progress_on_dashboard', v)}
                    />
                  </div>
                </div>
                <SaveButton onSave={() => saveSection('preferences', apiClient.updateLearnerPreferences.bind(apiClient))} saving={saving.preferences} />
              </SectionCard>
            )}

            {/* ══ PRIVACY & SECURITY ════════════════════════════════ */}
            {activeSection === 'privacy' && (
              <div className="space-y-5">
                {/* Change Password */}
                <SectionCard>
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                    <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
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

                {/* Account Info */}
                <SectionCard>
                  <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                    <div className="w-9 h-9 bg-slate-600 rounded-xl flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Account Information</h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Email</span>
                        <span className="text-sm font-semibold text-slate-800">{s.profile?.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Role</span>
                        <span className="text-sm font-semibold text-primary-600">Learner</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">NSQF Level</span>
                        <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">
                          Level {s.stats?.nsqf_level || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-slate-600">Active Certifications</span>
                        <span className="text-sm font-semibold text-emerald-600">{s.stats?.certifications || 0}</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
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

export default LearnerSettings;
