import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import apiClient from '../utils/api';

const AssessmentCreationModal = ({ courseId, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [passingScore, setPassingScore] = useState(60);
    const [questions, setQuestions] = useState([
        {
            question_id: 'q1',
            text: '',
            options: ['', '', '', ''],
            correct_option: 0
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_id: `q${Date.now()}`,
                text: '',
                options: ['', '', '', ''],
                correct_option: 0
            }
        ]);
    };

    const handleRemoveQuestion = (index) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex] = value;
        setQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        if (!title.trim()) {
            setError("Title is required");
            return;
        }

        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].text.trim()) {
                setError(`Question ${i + 1} text is required`);
                return;
            }
            if (questions[i].options.some(opt => !opt.trim())) {
                setError(`All options for Question ${i + 1} are required`);
                return;
            }
        }

        setLoading(true);

        try {
            const payload = {
                course_id: courseId,
                title,
                description,
                passing_score: parseInt(passingScore),
                questions: questions.map(q => ({
                    question_id: q.question_id,
                    text: q.text,
                    options: q.options,
                    correct_option: parseInt(q.correct_option)
                }))
            };

            const response = await apiClient.createAssessment(courseId, payload);

            if (response.success) {
                onSuccess();
                onClose();
            } else {
                setError(response.message || "Failed to create assessment");
            }
        } catch (err) {
            console.error(err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-900">Create Assessment</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form id="assessment-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Assessment Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="e.g. Final Exam: Web Development"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Passing Score (%)</label>
                                <input
                                    type="number"
                                    value={passingScore}
                                    onChange={(e) => setPassingScore(e.target.value)}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none h-24 resize-none"
                                placeholder="Brief description of the assessment..."
                            />
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800">Questions</h3>
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    className="flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    <Plus size={16} /> Add Question
                                </button>
                            </div>

                            {questions.map((q, qIndex) => (
                                <div key={q.question_id} className="p-6 bg-slate-50 rounded-xl border border-slate-200 relative group">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={questions.length === 1}
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="mb-4">
                                        <label className="text-sm font-semibold text-slate-700 block mb-2">Question {qIndex + 1}</label>
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                            placeholder="Enter question text..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {q.options.map((opt, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.question_id}`}
                                                    checked={q.correct_option === oIndex}
                                                    onChange={() => handleQuestionChange(qIndex, 'correct_option', oIndex)}
                                                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none"
                                                    placeholder={`Option ${oIndex + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="assessment-form"
                        className="px-6 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Save Assessment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentCreationModal;
