import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, BrainCircuit, Activity, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../utils/api';

const TrainerAssessments = ({ userRole }) => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(false);

    // AI Generation State
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('Medium');
    const [aiType, setAiType] = useState('mcq');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await apiClient.getTrainerCourses();
            if (res.success && res.data.courses) {
                setCourses(res.data.courses);
                if (res.data.courses.length > 0) {
                    setSelectedCourse(res.data.courses[0].course_id);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (selectedCourse) fetchAssessments(selectedCourse);
    }, [selectedCourse]);

    const fetchAssessments = async (courseId) => {
        try {
            setLoading(true);
            const res = await apiClient.getAssessments(courseId);
            if (res.success) {
                setAssessments(res.data.assessments || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiTopic) return alert("Please enter a topic");
        setGenerating(true);
        try {
            const res = await apiClient.generateQuestions({
                topic: aiTopic,
                difficulty: aiDifficulty,
                question_type: aiType,
                num_questions: 3
            });
            if (res.success) {
                // Here we would normally plug this into an Assessment Builder form
                // For demonstration purposes, we will directly create an assessment
                await createAIAssessment(res.data);
            }
        } catch (e) {
            alert("AI Generation failed.");
        } finally {
            setGenerating(false);
            setShowAIGenerator(false);
            fetchAssessments(selectedCourse);
        }
    };

    const createAIAssessment = async (questions) => {
        await apiClient.createAssessment(selectedCourse, {
            title: `AI Generated Quiz: ${aiTopic}`,
            description: "Auto-generated assessment to test concepts.",
            questions: questions,
            passing_score: 60,
            time_duration_minutes: 30,
            retake_limit: 2,
            randomize_questions: true,
            shuffle_options: true
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assessment Center</h1>
                    <p className="text-slate-500">Create tests, manage submissions, and utilize AI generation</p>
                </div>
                <button
                    onClick={() => setShowAIGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                    <BrainCircuit className="w-5 h-5" />
                    <span>AI Auto-Generate</span>
                </button>
            </div>

            <div className="glass p-4 rounded-2xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Course to Manage Restrictions & Assessments</label>
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                    {courses.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.title}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : assessments.length === 0 ? (
                <div className="text-center py-12 glass rounded-3xl border border-slate-200">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No assessments configured</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Use the AI Assessment Builder to instantly generate questions.</p>
                    <button onClick={() => setShowAIGenerator(true)} className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">Start Building</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assessments.map(assessment => (
                        <motion.div
                            key={assessment.assessment_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                                    {assessment.questions.length} Questions
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{assessment.title}</h3>
                            <p className="text-slate-500 text-sm mb-4 line-clamp-2">{assessment.description}</p>

                            <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Clock className="w-4 h-4" /> Time Limit</span>
                                    <span className="font-medium">{assessment.time_duration_minutes} min</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Passing Score</span>
                                    <span className="font-medium text-emerald-600">{assessment.passing_score}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-1"><Activity className="w-4 h-4" /> Retakes</span>
                                    <span className="font-medium">{assessment.retake_limit} Allowed</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors">Submissions</button>
                                <button className="w-10 flex items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">...</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* AI Generator Modal */}
            <AnimatePresence>
                {showAIGenerator && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
                            <button onClick={() => setShowAIGenerator(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center"><BrainCircuit className="w-6 h-6 text-indigo-600" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">AI Test Builder</h2>
                                    <p className="text-sm text-slate-500">Powered by Llama-3.1</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Topic / Syllabus Context</label>
                                    <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Advanced React Hooks" className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Question Type</label>
                                        <select value={aiType} onChange={e => setAiType(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="mcq">Multiple Choice</option>
                                            <option value="true_false">True / False</option>
                                            <option value="short_answer">Short Answer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                                        <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                                            <option value="Beginner">Beginner</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateAI}
                                    disabled={generating}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                    {generating ? <span className="animate-pulse">Generating...</span> : <span>Generate Test Bank</span>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TrainerAssessments;
