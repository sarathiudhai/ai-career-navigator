import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Target, CheckCircle, Lock, BookOpen, Clock,
    ArrowRight, Loader2, Zap, Award
} from 'lucide-react';
import apiClient from '../utils/api';

const LearningPath = () => {
    const [roadmapData, setRoadmapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoadmap = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getLearnerRoadmap();
                if (response.success) {
                    setRoadmapData(response.data);
                } else {
                    setError(response.message || 'Failed to load roadmap.');
                }
            } catch (err) {
                setError('Failed to load your learning roadmap. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoadmap();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-10 h-10 text-primary-600" />
                </motion.div>
                <p className="text-slate-500 font-medium">AI Buddy is generating your personalized roadmap...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100 max-w-md">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Roadmap Unavailable</h3>
                    <p className="text-red-600">{error}</p>
                    <p className="text-sm text-slate-500 mt-3">Please complete your profile to generate a roadmap.</p>
                </div>
            </div>
        );
    }

    const { nsqf_level = 0, target_career = '', learning_path = [], recommended_courses = [] } = roadmapData || {};

    const getStepStatus = (stepLevel) => {
        if (stepLevel < nsqf_level) return 'completed';
        if (stepLevel === nsqf_level) return 'current';
        return 'upcoming';
    };

    const totalLevels = 10;
    const progressPct = Math.round((nsqf_level / totalLevels) * 100);

    return (
        <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-primary-700 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">Your AI Buddy Roadmap</h1>
                            <p className="text-indigo-200">NSQF Level Progression Plan • {target_career || 'Career Path'}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm font-semibold text-indigo-200 mb-2">
                            <span>Level {nsqf_level} (Current)</span>
                            <span>Level 10 (Expert)</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>
                        <p className="text-xs text-indigo-200 mt-1">{progressPct}% to Expert Level</p>
                    </div>
                </div>
            </div>

            {/* Level Timeline */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Your NSQF Level Roadmap
                </h2>

                {learning_path.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-700 mb-2">No Roadmap Generated Yet</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">Complete your profile setup to get a personalized NSQF roadmap generated by AI Buddy.</p>
                    </div>
                ) : (
                    <div className="relative pl-8">
                        {/* Vertical line */}
                        <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-400 via-slate-200 to-slate-100 rounded-full" />

                        <div className="space-y-6">
                            {learning_path.map((step, idx) => {
                                const status = getStepStatus(step.level);
                                return (
                                    <motion.div
                                        key={step.level}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.08 }}
                                        className="relative"
                                    >
                                        {/* Circle */}
                                        <div className={`absolute -left-8 top-5 w-7 h-7 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${status === 'completed' ? 'bg-emerald-500' :
                                                status === 'current' ? 'bg-indigo-600 ring-4 ring-indigo-100' :
                                                    'bg-slate-300'
                                            }`}>
                                            {status === 'completed' ? (
                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                            ) : status === 'current' ? (
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2.5 h-2.5 bg-white rounded-full" />
                                            ) : (
                                                <Lock className="w-3 h-3 text-white" />
                                            )}
                                        </div>

                                        {/* Card */}
                                        <div className={`ml-4 p-5 rounded-2xl border transition-all ${status === 'current'
                                                ? 'border-indigo-200 bg-indigo-50 shadow-md shadow-indigo-100'
                                                : status === 'completed'
                                                    ? 'border-emerald-100 bg-emerald-50/50'
                                                    : 'border-slate-100 bg-white'
                                            }`}>
                                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                                <div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mr-2 ${status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            status === 'current' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {status === 'completed' ? '✓ Completed' : status === 'current' ? '▶ Current' : 'Upcoming'}
                                                    </span>
                                                    <h3 className="inline font-bold text-slate-900 text-base">
                                                        {step.title || `NSQF Level ${step.level}`}
                                                    </h3>
                                                </div>
                                                {step.estimated_weeks > 0 && (
                                                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {step.estimated_weeks} Weeks
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-600 mb-4 leading-relaxed">{step.description}</p>

                                            {/* Skills Chips */}
                                            {step.skills && step.skills.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Skills to Master:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {step.skills.map((skill, i) => (
                                                            <span
                                                                key={i}
                                                                className={`text-xs px-2.5 py-1 rounded-lg font-medium ${status === 'current'
                                                                        ? 'bg-indigo-100 text-indigo-700'
                                                                        : status === 'completed'
                                                                            ? 'bg-emerald-100 text-emerald-700'
                                                                            : 'bg-slate-100 text-slate-600'
                                                                    }`}
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Recommended Courses */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary-600" />
                    Recommended Courses for You
                    <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        NSQF Level {nsqf_level}+ • {target_career || 'All Domains'}
                    </span>
                </h2>

                {recommended_courses.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-600 mb-1">No Matching Courses Found</h3>
                        <p className="text-sm text-slate-400">Ask your trainer to add courses in your career domain.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {recommended_courses.map((course, idx) => (
                            <motion.div
                                key={course.course_id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.07 }}
                                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-indigo-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">NSQF {course.nsqf_level}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition">{course.title}</h4>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description || 'Explore this course to advance your skills.'}</p>
                                </div>
                                {course.domain_tags && course.domain_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {course.domain_tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <a
                                    href="/courses"
                                    className="mt-auto flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition"
                                >
                                    Go to Courses <ArrowRight className="w-4 h-4" />
                                </a>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPath;
