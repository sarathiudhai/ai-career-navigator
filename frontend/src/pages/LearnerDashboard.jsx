import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  Star,
  Award,
  Lightbulb,
  ArrowRight,
  Zap,
  Loader2,
  CheckCircle,
  Circle,
  Play,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../utils/api';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollingCourse, setEnrollingCourse] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecommendations();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getLearnerDashboard();
      if (data.error) {
        throw new Error(data.message || 'Failed to fetch data');
      }
      setDashboardData(data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      if (error.status === 401 || error.message?.includes('401')) {
        // Token expired or unauthorized
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const data = await apiClient.getCourseRecommendations();
      setRecommendations(data.data?.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingCourse(courseId);
      const response = await apiClient.enrollCourse(courseId);
      if (response.success) {
        alert('Successfully enrolled in course!');
        fetchDashboardData();
        fetchRecommendations();
      } else {
        alert(response.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrollingCourse(null);
    }
  };

  const handleUpdateProgress = async (courseId, newProgress) => {
    try {
      const response = await apiClient.updateCourseProgress(courseId, newProgress);
      if (response.success) {
        fetchDashboardData();
      } else {
        alert(response.message || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Progress update error:', error);
      alert('Failed to update progress. Please try again.');
    }
  };

  // ── Loading state ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-slate-600">Loading dashboard...</span>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // ── Extract API data ────────────────────────────────────────
  const profile = dashboardData?.profile || {};
  const nsqfLevel = dashboardData?.nsqf_level || 0;
  const learningPath = dashboardData?.learning_path || [];
  const courses = dashboardData?.courses || [];
  const courseProgress = dashboardData?.course_progress || {};
  const certifications = dashboardData?.certifications || [];
  const overallProgress = dashboardData?.overall_progress || 0;
  const skillGap = dashboardData?.skill_gap_analysis || {};

  // Build roadmap steps dynamically from NSQF level
  const buildRoadmapSteps = () => {
    if (!nsqfLevel || nsqfLevel === 0) return [];

    const steps = [];
    const startLevel = Math.max(1, nsqfLevel - 1);
    const endLevel = Math.min(10, nsqfLevel + 2);
    const levelNames = {
      1: 'Foundational', 2: 'Basics', 3: 'Beginner', 4: 'Foundation',
      5: 'Intermediate', 6: 'Advanced', 7: 'Expert', 8: 'Specialist',
      9: 'Master', 10: 'Authority'
    };

    for (let i = startLevel; i <= endLevel; i++) {
      const rawStep = learningPath?.[i - startLevel];
      let description = `NSQF Level ${i} skills`;
      let title = levelNames[i] || `Level ${i}`;

      if (rawStep) {
        if (typeof rawStep === 'string') {
          description = rawStep;
        } else if (typeof rawStep === 'object') {
          description = rawStep.description || rawStep.title || description;
          if (rawStep.title) title = rawStep.title;
        }
      }

      steps.push({
        level: i,
        title: title,
        status: i < nsqfLevel ? 'completed' : i === nsqfLevel ? 'current' : 'upcoming',
        description: description
      });
    }
    return steps;
  };

  const roadmapSteps = buildRoadmapSteps();

  // ── Circular progress component ─────────────────────────────
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = 'primary' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius}
            stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-slate-200" />
          <motion.circle cx={size / 2} cy={size / 2} r={radius}
            stroke="currentColor" strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className={`text-${color}-600`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeInOut" }}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header — dynamic name + career */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back, {profile.name || 'Learner'}!
        </h1>
        <p className="text-slate-600">
          {profile.target_career
            ? `Continue your journey to ${profile.target_career}`
            : 'Start your learning journey today'}
        </p>
      </motion.div>

      {/* Stats Grid — ALL dynamic from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-primary-600" />
            </div>
            {nsqfLevel > 0 && (
              <span className="text-sm text-success-600 font-medium">Active</span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">NSQF Level {nsqfLevel}</h3>
          <p className="text-sm text-slate-600">Current Qualification</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-success-600" />
            </div>
            <span className="text-sm text-success-600 font-medium">
              {courses.length > 0 ? 'Active' : 'None'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
          </h3>
          <p className="text-sm text-slate-600">Enrolled</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">{overallProgress}%</h3>
          <p className="text-sm text-slate-600">Overall Progress</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-1">
            {certifications.length} {certifications.length === 1 ? 'Certificate' : 'Certificates'}
          </h3>
          <p className="text-sm text-slate-600">Earned</p>
        </div>
      </motion.div>

      {/* Skill Gap Insights — dynamic from API */}
      {skillGap && skillGap.recommendations && skillGap.recommendations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          className="card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Skill Gap Analysis</h2>
              {skillGap.match_percentage !== undefined && (
                <p className="text-sm text-slate-600">
                  {skillGap.match_percentage}% match with target role
                </p>
              )}
            </div>
          </div>
          {skillGap.missing_skills && skillGap.missing_skills.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-700 mb-2">Skills to develop:</p>
              <div className="flex flex-wrap gap-2">
                {skillGap.missing_skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          <ul className="space-y-2">
            {skillGap.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Learning Roadmap — dynamic from NSQF level */}
      {roadmapSteps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="card mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Learning Roadmap</h2>
          <div className="relative">
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200" />
            <div className="space-y-8">
              {roadmapSteps.map((step, index) => (
                <motion.div key={step.level}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  className="flex items-center gap-6">
                  <div className="relative z-10">
                    {step.status === 'completed' ? (
                      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-success-600" />
                      </div>
                    ) : step.status === 'current' ? (
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 bg-primary-600 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Circle className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900">NSQF Level {step.level}: {step.title}</h3>
                      {step.status === 'current' && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Enrolled Courses — dynamic from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
        className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {courses.length > 0 ? 'Continue Learning' : 'My Courses'}
          </h2>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = courseProgress[course.course_id] || 0;
              return (
                <motion.div key={course.course_id}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="card group cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mb-4 flex items-center justify-center">
                    <Play className="w-12 h-12 text-primary-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-slate-600 mb-1 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded">NSQF {course.nsqf_level}</span>
                    {course.modules && (
                      <span>{course.modules.length} modules</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <motion.div className="bg-primary-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1">
                      {progress > 0 ? 'Continue' : 'Start Course'}
                    </button>
                    {/* Assessment Button */}
                    {course.assessments && course.assessments.length > 0 && (
                      <button
                        onClick={() => navigate(`/courses/${course.course_id}/assessment`)}
                        className="btn-secondary px-3 flex-1 border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Take Exam
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newProgress = prompt(`Update progress for ${course.title} (0-100):`, progress);
                        if (newProgress !== null && !isNaN(newProgress)) {
                          handleUpdateProgress(course.course_id, Math.min(100, Math.max(0, parseInt(newProgress))));
                        }
                      }}
                      className="btn-secondary px-3" title="Update Progress">
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No courses enrolled yet</h3>
            <p className="text-slate-500 mb-4">Check out the recommended courses below to get started!</p>
          </div>
        )}
      </motion.div>

      {/* Recommended Courses — dynamic from API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recommended Courses</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recommendations.length > 0 ? (
            recommendations.map((course) => (
              <motion.div key={course.course_id}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="card group cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mb-4 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-lg">
                    NSQF Level {course.nsqf_level}
                  </span>
                  {course.completion_rate > 0 && (
                    <span className="px-2 py-1 bg-success-100 text-success-700 text-xs font-medium rounded-lg">
                      {course.completion_rate}% Completion Rate
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
                {course.skills_gained && course.skills_gained.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {course.skills_gained.slice(0, 3).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleEnroll(course.course_id)}
                  disabled={enrollingCourse === course.course_id}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {enrollingCourse === course.course_id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling...</>
                  ) : (
                    <><BookOpen className="w-4 h-4" /> Enroll Now</>
                  )}
                </button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-slate-600">No course recommendations available at the moment.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* AI Recommended Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recommended for You</h2>
            <p className="text-sm text-slate-500">Based on your {dashboardData?.profile?.target_career || 'profile'}</p>
          </div>
          <button className="text-primary-600 font-semibold hover:text-primary-700">See All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI / Hybrid Recommendations */}
          {recommendations.length > 0 ? (
            recommendations.map((course, index) => (
              <motion.div
                key={course.course_id || index}
                whileHover={{ scale: 1.02 }}
                className="card group cursor-pointer h-full flex flex-col"
              >
                <div className="aspect-video bg-slate-100 rounded-xl mb-4 relative overflow-hidden">
                  {/* Placeholder for course image */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-indigo-300" />
                  </div>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-primary-600 shadow-sm">
                    {course.match_percentage ? `${course.match_percentage}% Match` : 'Recommended'}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(course.skills_gained || []).slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-sm font-semibold text-slate-900">
                    {course.nsqf_level ? `NSQF L${course.nsqf_level}` : 'Beginner'}
                  </span>
                  <button
                    onClick={() => apiClient.enrollCourse(course.course_id).then(() => {
                      alert("Enrolled successfully!");
                      fetchDashboardData();
                    })}
                    className="text-sm font-bold text-primary-600 hover:text-primary-700"
                  >
                    Enroll Now
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No specific recommendations yet. Complete your profile to get started!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Certifications — dynamic from API */}
      {certifications.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
          <h2 className="text-xl font-bold text-slate-900 mb-6">Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <motion.div key={cert.certification_id || index}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ scale: 1.03 }}
                className="card text-center border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{cert.course_id}</h3>
                <p className="text-sm text-slate-600">NSQF Level {cert.nsqf_level}</p>
                <span className={`mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full ${cert.status === 'issued'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-slate-100 text-slate-600'
                  }`}>
                  {cert.status === 'issued' ? '✓ Issued' : cert.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LearnerDashboard;
