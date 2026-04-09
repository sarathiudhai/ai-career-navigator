import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '../utils/api';
import confetti from 'canvas-confetti';

const AssessmentPlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
    const [submissionResult, setSubmissionResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAssessment();
    }, [courseId]);

    const fetchAssessment = async () => {
        try {
            setIsLoading(true);
            // Fetch assessments for the course. Assuming 1 assessment per course for now or picking the first.
            const response = await apiClient.getLearnerAssessments(courseId);
            if (response.success) {
                // The endpoint returns a list of assessments for this course directly
                // So we don't need to filter by courseId again if the endpoint is specific
                // But let's check the response structure from learners.py get_learner_assessments
                // It returns APIResponse with data being the list of assessments.
                // The endpoint returns APIResponse with data containing "assessments" key.
                const assessments = response.data.assessments || [];
                if (assessments.length > 0) {
                    setAssessment(assessments[0]);
                } else {
                    setError("No assessment found for this course.");
                }
            } else {
                setError("Failed to load assessments.");
            }
        } catch (err) {
            console.error("Error fetching assessment:", err);
            setError("Failed to load assessment. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptionSelect = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        // Validate all questions answered
        const unanswered = assessment.questions.some((q, idx) => answers[idx] === undefined); // Assuming questions have IDs or using index
        if (unanswered) {
            alert("Please answer all questions before submitting.");
            return;
        }

        try {
            setIsSubmitting(true);
            // Construct payload. Backend expects { answers: { "0": 1, "1": 0 } } or similar?
            // Let's check backend model. usually list of answers or map.
            // Based on common patterns: { answers: { question_id: selected_option_index } }
            // But here questions might not have explicit IDs if they are embedded. 
            // Let's assume index-based key if no ID, or check `models.py`. 
            // User request said "Assessment Workflow".

            const payload = {
                assessment_id: assessment.assessment_id,
                answers: answers // keys are indices or IDs
            };

            const response = await apiClient.submitAssessment(assessment.assessment_id, payload);

            if (response.success) {
                setSubmissionResult(response.data);
                if (response.data.passed) {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
            } else {
                alert(response.message || "Submission failed");
            }
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit assessment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                <span className="ml-2">Loading assessment...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
                <p className="text-slate-600 mb-6">{error}</p>
                <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (submissionResult) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-xl max-w-lg w-full text-center"
                >
                    <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${submissionResult.passed ? 'bg-success-100' : 'bg-red-100'}`}>
                        {submissionResult.passed ? (
                            <CheckCircle className="w-10 h-10 text-success-600" />
                        ) : (
                            <XCircle className="w-10 h-10 text-red-600" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {submissionResult.passed ? "Assessment Passed!" : "Assessment Failed"}
                    </h2>

                    <p className="text-slate-600 mb-6">
                        You scored <span className="font-bold text-slate-900">{submissionResult.score}%</span>.
                        {submissionResult.passed ? " Great job! Your certificate has been generated." : " Keep learning and try again."}
                    </p>

                    <div className="flex gap-4 justify-center">
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary">
                            Dashboard
                        </button>
                        {submissionResult.passed && (
                            <button onClick={() => navigate('/certificates')} className="btn-primary">
                                View Certificate
                            </button>
                        )}
                        {!submissionResult.passed && (
                            <button onClick={() => window.location.reload()} className="btn-primary">
                                Retry
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    const question = assessment.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{assessment.title}</h1>
                        <p className="text-slate-600">Question {currentQuestionIndex + 1} of {assessment.questions.length}</p>
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                        Passing Score: {assessment.passing_score}%
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
                    <motion.div
                        className="bg-primary-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%` }}
                    />
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-sm mb-8"
                >
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">
                        {question.question_text}
                    </h3>

                    <div className="space-y-3">
                        {question.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOptionSelect(currentQuestionIndex, idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQuestionIndex] === idx
                                    ? 'border-primary-600 bg-primary-50 text-primary-900'
                                    : 'border-slate-100 hover:border-slate-200 text-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestionIndex] === idx
                                        ? 'border-primary-600'
                                        : 'border-slate-300'
                                        }`}>
                                        {answers[currentQuestionIndex] === idx && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                                        )}
                                    </div>
                                    {option}
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="btn-secondary disabled:opacity-50"
                    >
                        Previous
                    </button>

                    {currentQuestionIndex < assessment.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="btn-primary"
                        >
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="btn-primary bg-success-600 hover:bg-success-700"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                            ) : (
                                "Submit Assessment"
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssessmentPlayer;
