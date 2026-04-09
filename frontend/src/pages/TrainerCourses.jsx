import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Users, BarChart3, Plus, Search, Edit2, Trash2,
  Eye, Star, CheckCircle, Video, FileText, X, ChevronRight,
  GripVertical, Loader2, AlertTriangle, PlusCircle, MinusCircle
} from 'lucide-react';
import apiClient from '../utils/api';

// ─── Empty module template ────────────────────────────────────────────────────
const emptyModule = () => ({
  title: '',
  description: '',
  duration_hours: 1,
  video_url: '',
  pdf_resources: [],
  content: [],
});

// ─── Empty form template ─────────────────────────────────────────────────────
const emptyForm = () => ({
  title: '',
  description: '',
  nsqf_level: 4,
  duration_weeks: 8,
  difficulty_level: 'Beginner',
  status: 'draft',
  prerequisites: '',
  skills_gained: '',
  domain_tags: '',
  modules: [emptyModule()],
});

// ─── Toast helper ─────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white font-medium max-w-sm ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
    }`}
  >
    {type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-auto"><X className="w-4 h-4" /></button>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TrainerCourses = ({ userRole }) => {
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create-form modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Course-detail modal state
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('overview');
  const [courseStudents, setCourseStudents] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchCourses(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getTrainerCourses();
      if (res.success) {
        setCourses(res.data.courses || []);
        const analyticsMap = {};
        for (const course of (res.data.courses || [])) {
          try {
            const aRes = await apiClient.getCourseAnalytics(course.course_id);
            if (aRes.success) analyticsMap[course.course_id] = aRes.data;
          } catch (e) { /* analytics failures are non-fatal */ }
        }
        setAnalytics(analyticsMap);
      }
    } catch (err) {
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setFormData(emptyForm());
    setFormErrors({});
    setShowCreateModal(true);
  };

  const closeCreateModal = () => { setShowCreateModal(false); };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleModuleChange = (idx, field, value) => {
    setFormData(prev => {
      const mods = [...prev.modules];
      mods[idx] = { ...mods[idx], [field]: value };
      return { ...prev, modules: mods };
    });
  };

  const addModule = () => {
    setFormData(prev => ({ ...prev, modules: [...prev.modules, emptyModule()] }));
  };

  const removeModule = (idx) => {
    setFormData(prev => ({ ...prev, modules: prev.modules.filter((_, i) => i !== idx) }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) errors.title = 'Title must be at least 3 characters.';
    if (!formData.description.trim() || formData.description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
    if (!formData.nsqf_level || formData.nsqf_level < 1 || formData.nsqf_level > 10) errors.nsqf_level = 'NSQF Level must be between 1 and 10.';
    if (!formData.duration_weeks || formData.duration_weeks < 1) errors.duration_weeks = 'Duration must be at least 1 week.';
    formData.modules.forEach((m, i) => {
      if (!m.title.trim() || m.title.trim().length < 2) errors[`module_${i}_title`] = `Module ${i + 1} title is required (min 2 chars).`;
    });
    return errors;
  };

  // ── Create course ─────────────────────────────────────────────────────────
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        nsqf_level: Number(formData.nsqf_level),
        duration_weeks: Number(formData.duration_weeks),
        difficulty_level: formData.difficulty_level,
        status: formData.status,
        prerequisites: formData.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
        skills_gained: formData.skills_gained.split(',').map(s => s.trim()).filter(Boolean),
        domain_tags: formData.domain_tags.split(',').map(s => s.trim()).filter(Boolean),
        modules: formData.modules.map(m => ({
          title: m.title.trim(),
          description: m.description.trim(),
          duration_hours: Number(m.duration_hours) || 1,
          video_url: m.video_url.trim() || null,
          pdf_resources: [],
          content: [],
        })),
      };

      const res = await apiClient.createCourse(payload);
      if (res.success) {
        closeCreateModal();
        showToast(`✅ Course "${payload.title}" created successfully!`);
        fetchCourses();
      } else {
        showToast(res.message || 'Failed to create course.', 'error');
      }
    } catch (err) {
      const detail = err?.message || 'Failed to create course. Please check all fields.';
      showToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete course ─────────────────────────────────────────────────────────
  const confirmDelete = (course, e) => {
    e.stopPropagation();
    setDeleteTarget(course);
  };

  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiClient.deleteTrainerCourse(deleteTarget.course_id);
      if (res.success) {
        setDeleteTarget(null);
        if (selectedCourse?.course_id === deleteTarget.course_id) setSelectedCourse(null);
        showToast(`🗑️ Course "${deleteTarget.title}" deleted.`);
        fetchCourses();
      } else {
        showToast(res.message || 'Could not delete course.', 'error');
      }
    } catch (err) {
      showToast('Failed to delete course.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Course detail ─────────────────────────────────────────────────────────
  const handleOpenCourseDetails = async (course) => {
    setSelectedCourse(course);
    setViewMode('overview');
    setAiSuggestions(null);
    try {
      const sRes = await apiClient.getCourseStudents(course.course_id);
      if (sRes.success) setCourseStudents(sRes.data.students || []);
    } catch (e) { console.error(e); }
  };

  const handleGetAiSuggestions = async (courseId) => {
    try {
      const res = await apiClient.courseImprovementSuggestions(courseId);
      if (res.success) setAiSuggestions(res.data.suggestions);
    } catch (e) { showToast('AI failed to generate suggestions.', 'error'); }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.domain_tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── STATUS BADGE ─────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      published: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-slate-100 text-slate-600',
      draft: 'bg-amber-100 text-amber-700',
    };
    return map[status] || map.draft;
  };

  // ─── FIELD COMPONENT ──────────────────────────────────────────────────────
  const FormField = ({ label, error, required, children }) => (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition ${
      err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
    }`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
          <p className="text-slate-500 text-sm mt-1">Create, manage and analyze your courses</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> New Course
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-slate-500 text-sm">Loading courses...</p>
        </div>
      ) : error ? (
        <div className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />{error}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200">
          <BookOpen className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No courses found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
            {courses.length === 0 ? 'Create your first course to start teaching.' : 'No courses match your current filters.'}
          </p>
          {courses.length === 0 && (
            <button onClick={openCreateModal} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold">
              Create First Course
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const stats = analytics[course.course_id] || { total_enrolled: 0, completion_rate: 0, average_assessment_score: 0 };
            return (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${statusBadge(course.status)}`}>
                      {(course.status || 'draft').toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full">NSQF {course.nsqf_level}</span>
                      <button
                        onClick={(e) => confirmDelete(course, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">{course.title}</h3>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">{course.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <Users className="w-3.5 h-3.5" /><span className="text-xs font-medium">Enrolled</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">{stats.total_enrolled}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                        <CheckCircle className="w-3.5 h-3.5" /><span className="text-xs font-medium">Completion</span>
                      </div>
                      <div className="text-xl font-bold text-slate-900">{stats.completion_rate}%</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(course.domain_tags || []).slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">{tag}</span>
                    ))}
                  </div>
                </div>

                <div
                  className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
                  onClick={() => handleOpenCourseDetails(course)}
                >
                  <span className="text-sm font-semibold text-primary-600">Manage Course</span>
                  <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── CREATE COURSE MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Create New Course</h2>
                  <p className="text-sm text-slate-500">Fill in all required details before publishing</p>
                </div>
                <button onClick={closeCreateModal} className="p-2 hover:bg-slate-100 rounded-full transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateCourse} className="overflow-y-auto flex-1 p-6 space-y-5">

                {/* Course Title */}
                <FormField label="Course Title" required error={formErrors.title}>
                  <input
                    type="text" placeholder="e.g. Full Stack Web Development"
                    value={formData.title} onChange={e => handleFieldChange('title', e.target.value)}
                    className={inputCls(formErrors.title)}
                  />
                </FormField>

                {/* Description */}
                <FormField label="Description" required error={formErrors.description}>
                  <textarea
                    placeholder="Describe what learners will achieve in this course..."
                    value={formData.description} onChange={e => handleFieldChange('description', e.target.value)}
                    rows={3} className={inputCls(formErrors.description)}
                  />
                </FormField>

                {/* Row: NSQF + Duration + Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="NSQF Level" required error={formErrors.nsqf_level}>
                    <select value={formData.nsqf_level} onChange={e => handleFieldChange('nsqf_level', e.target.value)} className={inputCls(formErrors.nsqf_level)}>
                      {[1,2,3,4,5,6,7,8,9,10].map(l => <option key={l} value={l}>Level {l}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Duration (Weeks)" required error={formErrors.duration_weeks}>
                    <input type="number" min={1} value={formData.duration_weeks} onChange={e => handleFieldChange('duration_weeks', e.target.value)} className={inputCls(formErrors.duration_weeks)} />
                  </FormField>
                  <FormField label="Difficulty">
                    <select value={formData.difficulty_level} onChange={e => handleFieldChange('difficulty_level', e.target.value)} className={inputCls()}>
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                  </FormField>
                </div>

                {/* Row: Status */}
                <FormField label="Initial Status">
                  <select value={formData.status} onChange={e => handleFieldChange('status', e.target.value)} className={inputCls()}>
                    <option value="draft">Draft (save & edit later)</option>
                    <option value="published">Published (visible to learners)</option>
                  </select>
                </FormField>

                {/* Tags: comma-separated */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Skills Gained" >
                    <input type="text" placeholder="Python, ML, React (comma-separated)"
                      value={formData.skills_gained} onChange={e => handleFieldChange('skills_gained', e.target.value)} className={inputCls()} />
                  </FormField>
                  <FormField label="Domain Tags">
                    <input type="text" placeholder="Data Science, AI (comma-separated)"
                      value={formData.domain_tags} onChange={e => handleFieldChange('domain_tags', e.target.value)} className={inputCls()} />
                  </FormField>
                </div>

                <FormField label="Prerequisites">
                  <input type="text" placeholder="Basic Python, High School Math (comma-separated)"
                    value={formData.prerequisites} onChange={e => handleFieldChange('prerequisites', e.target.value)} className={inputCls()} />
                </FormField>

                {/* ── Modules ──────────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Course Modules</h3>
                    <button type="button" onClick={addModule} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition">
                      <PlusCircle className="w-4 h-4" /> Add Module
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.modules.map((mod, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Module {idx + 1}</span>
                          {formData.modules.length > 1 && (
                            <button type="button" onClick={() => removeModule(idx)} className="text-red-400 hover:text-red-600 transition">
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <FormField label="Module Title" required error={formErrors[`module_${idx}_title`]}>
                          <input type="text" placeholder="e.g. Introduction to Python"
                            value={mod.title} onChange={e => handleModuleChange(idx, 'title', e.target.value)}
                            className={inputCls(formErrors[`module_${idx}_title`])} />
                        </FormField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField label="Description">
                            <input type="text" placeholder="Brief module description"
                              value={mod.description} onChange={e => handleModuleChange(idx, 'description', e.target.value)} className={inputCls()} />
                          </FormField>
                          <FormField label="Duration (Hours)">
                            <input type="number" min={1} value={mod.duration_hours}
                              onChange={e => handleModuleChange(idx, 'duration_hours', e.target.value)} className={inputCls()} />
                          </FormField>
                        </div>

                        <FormField label="Video URL (optional)">
                          <input type="url" placeholder="https://youtube.com/..."
                            value={mod.video_url} onChange={e => handleModuleChange(idx, 'video_url', e.target.value)} className={inputCls()} />
                        </FormField>
                      </div>
                    ))}
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={closeCreateModal} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition">
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition disabled:opacity-60"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Course</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Course?</h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Are you sure you want to permanently delete <span className="font-semibold text-slate-700">"{deleteTarget.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COURSE DETAIL MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h2>
                  <p className="text-sm text-slate-500">Course Management Dashboard</p>
                </div>
                <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="w-44 bg-slate-50 border-r border-slate-100 p-3 space-y-1.5 flex-shrink-0">
                  {[
                    { key: 'overview', icon: BarChart3, label: 'Overview' },
                    { key: 'modules', icon: BookOpen, label: 'Modules' },
                    { key: 'students', icon: Users, label: 'Students' },
                  ].map(item => (
                    <button key={item.key} onClick={() => setViewMode(item.key)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${viewMode === item.key ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-100'}`}>
                      <item.icon className="w-4 h-4" />{item.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {/* Overview */}
                  {viewMode === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Completion Rate', value: `${analytics[selectedCourse.course_id]?.completion_rate || 0}%`, color: 'text-emerald-600' },
                          { label: 'Enrolled', value: analytics[selectedCourse.course_id]?.total_enrolled || 0, color: 'text-primary-600' },
                          { label: 'Avg Score', value: `${analytics[selectedCourse.course_id]?.average_assessment_score || 0}%`, color: 'text-amber-500' },
                        ].map((s, i) => (
                          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{s.label}</p>
                            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center"><Star className="w-5 h-5 text-white" /></div>
                          <div>
                            <h3 className="font-bold text-indigo-900">AI Course Optimization</h3>
                            <p className="text-indigo-600 text-xs">Data-driven suggestions to improve course performance</p>
                          </div>
                        </div>
                        {!aiSuggestions ? (
                          <button onClick={() => handleGetAiSuggestions(selectedCourse.course_id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                            Analyze Course
                          </button>
                        ) : (
                          <div className="bg-white/70 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{aiSuggestions}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  {viewMode === 'modules' && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Curriculum ({selectedCourse.modules?.length || 0} modules)</h3>
                      {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                        <p className="text-slate-500 text-sm">No modules added to this course yet.</p>
                      ) : selectedCourse.modules.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
                          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">{idx + 1}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 text-sm">{m.title}</h4>
                            <div className="flex gap-3 mt-0.5">
                              {m.video_url && <span className="flex items-center gap-1 text-xs text-slate-500"><Video className="w-3 h-3" />Video</span>}
                              {m.duration_hours && <span className="text-xs text-slate-500">{m.duration_hours}h</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Students */}
                  {viewMode === 'students' && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Enrolled Students ({courseStudents.length})</h3>
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase">
                            <tr>
                              <th className="px-5 py-3">Name</th><th className="px-5 py-3">Domain</th>
                              <th className="px-5 py-3">NSQF</th><th className="px-5 py-3">Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseStudents.length === 0 ? (
                              <tr><td colSpan="4" className="text-center py-8 text-slate-400">No students enrolled yet.</td></tr>
                            ) : courseStudents.map((s, i) => (
                              <tr key={i} className="bg-white border-t border-slate-100">
                                <td className="px-5 py-3 font-medium">{s.name}</td>
                                <td className="px-5 py-3 text-slate-500">{s.domain}</td>
                                <td className="px-5 py-3"><span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold">Lvl {s.nsqf_level}</span></td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-200 rounded-full h-1.5 max-w-[80px]">
                                      <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${s.progress}%` }} />
                                    </div>
                                    <span className="text-xs">{s.progress}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default TrainerCourses;
