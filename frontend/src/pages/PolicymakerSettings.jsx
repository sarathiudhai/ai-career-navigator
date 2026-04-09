import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Lock, Save, Loader2, CheckCircle, AlertTriangle,
  X, Eye, EyeOff, Shield, Building2
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

const ToggleRow = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    <button onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-slate-300'}`}>
      <span className={`absolute w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} style={{ top: '4px' }} />
    </button>
  </div>
);

const PolicymakerSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm: '' });
  const [showPw, setShowPw] = useState({});
  const [pwError, setPwError] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchSettings = async () => {
    try { setLoading(true);
      const res = await apiClient.getPolicymakerSettings();
      if (res.success) setSettings(res.data);
    } catch (e) { showToast('Failed to load settings', 'error'); }
    finally { setLoading(false); }
  };

  const updateField = (section, key, val) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], [key]: val } }));
  };

  const saveProfile = async () => {
    setSaving(p => ({ ...p, profile: true }));
    try {
      const res = await apiClient.updatePolicymakerProfile(settings.profile);
      if (res.success) showToast('Profile saved!');
      else showToast('Save failed', 'error');
    } catch (e) { showToast('Failed to save', 'error'); }
    finally { setSaving(p => ({ ...p, profile: false })); }
  };

  const saveNotifications = async () => {
    setSaving(p => ({ ...p, notif: true }));
    try {
      const res = await apiClient.updatePolicymakerNotifications(settings.notifications);
      if (res.success) showToast('Notifications saved!');
      else showToast('Save failed', 'error');
    } catch (e) { showToast('Failed to save', 'error'); }
    finally { setSaving(p => ({ ...p, notif: false })); }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwData.new_password !== pwData.confirm) { setPwError("Passwords don't match."); return; }
    if (pwData.new_password.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setSaving(p => ({ ...p, pw: true }));
    try {
      const res = await apiClient.changePolicymakerPassword({
        current_password: pwData.current_password, new_password: pwData.new_password
      });
      if (res.success) { showToast('Password changed!'); setPwData({ current_password: '', new_password: '', confirm: '' }); }
      else setPwError(res.detail || res.message || 'Incorrect password.');
    } catch (e) { setPwError(e?.message || 'Failed to change password.'); }
    finally { setSaving(p => ({ ...p, pw: false })); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /><span className="text-slate-500">Loading settings...</span></div>;
  if (!settings) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-red-500">Failed to load settings.</p></div>;

  const s = settings;

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User, color: 'bg-blue-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'bg-amber-500' },
    { id: 'security', label: 'Security', icon: Shield, color: 'bg-red-600' },
  ];

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 p-4 space-y-1 hidden md:block">
        <div className="px-3 pb-4 mb-2 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Policymaker preferences</p>
        </div>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left
              ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <div className={`w-7 h-7 ${activeTab === tab.id ? tab.color : 'bg-slate-200'} rounded-lg flex items-center justify-center transition-colors`}>
              <tab.icon className="w-3.5 h-3.5 text-white" />
            </div>
            {tab.label}
          </button>
        ))}
      </aside>

      {/* Mobile Tab */}
      <div className="md:hidden w-full absolute top-0 left-0 bg-white border-b border-slate-200 flex gap-2 px-4 py-2 z-20">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition
              ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <tab.icon className="w-3 h-3" />{tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-16 md:pt-8 max-w-3xl space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                  <h2 className="text-lg font-bold text-slate-900">Profile & Identity</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                      {(s.profile?.name || 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{s.profile?.name || 'Policymaker'}</p>
                      <p className="text-sm text-slate-500">{s.profile?.email || ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                      <input type="text" value={s.profile?.name || ''} onChange={e => updateField('profile', 'name', e.target.value)} className={inputCls} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Designation</label>
                      <input type="text" value={s.profile?.designation || ''} onChange={e => updateField('profile', 'designation', e.target.value)} className={inputCls} placeholder="e.g. Director" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
                      <input type="text" value={s.profile?.department || ''} onChange={e => updateField('profile', 'department', e.target.value)} className={inputCls} placeholder="e.g. Skill Development" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Government Body</label>
                      <input type="text" value={s.profile?.government_body || ''} onChange={e => updateField('profile', 'government_body', e.target.value)} className={inputCls} placeholder="e.g. NCVET / MSDE" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <button onClick={saveProfile} disabled={saving.profile}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition disabled:opacity-60">
                    {saving.profile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving.profile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                  <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center"><Bell className="w-4 h-4 text-white" /></div>
                  <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
                </div>
                <div className="px-6 py-4">
                  <ToggleRow label="Milestone Alerts" description="Get notified when platform reaches milestones (e.g. 1000 certifications)" checked={s.notifications?.milestone_alerts} onChange={v => updateField('notifications', 'milestone_alerts', v)} />
                  <ToggleRow label="New Trainer Alerts" description="Notify when a new trainer registers on the platform" checked={s.notifications?.new_trainer_alerts} onChange={v => updateField('notifications', 'new_trainer_alerts', v)} />
                  <ToggleRow label="Weekly Digest" description="Receive a weekly email summary of platform activity" checked={s.notifications?.weekly_digest} onChange={v => updateField('notifications', 'weekly_digest', v)} />
                </div>
                <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <button onClick={saveNotifications} disabled={saving.notif}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition disabled:opacity-60">
                    {saving.notif ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving.notif ? 'Saving...' : 'Save Notifications'}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                  <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>
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
                          className={`${inputCls} pr-10`}
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
                  <button onClick={handleChangePassword} disabled={saving.pw}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-60">
                    {saving.pw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {saving.pw ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
};

export default PolicymakerSettings;
