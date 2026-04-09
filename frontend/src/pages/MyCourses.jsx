import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, BarChart, PlayCircle } from 'lucide-react';
import apiClient from '../utils/api';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await apiClient.getLearnerDashboard();
                if (response.success) {
                    // Merge course details with progress
                    const dashboardData = response.data;
                    const courseList = dashboardData.courses.map(course => ({
                        ...course,
                        progress: dashboardData.course_progress[course.course_id] || 0
                    }));
                    setCourses(courseList);
                } else {
                    setError(response.message);
                }
            } catch (err) {
                setError('Failed to load courses');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
                    <p className="text-slate-600 mt-2">Continue your learning journey</p>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No courses enrolled</h3>
                    <p className="text-slate-600 mb-6">Explore the catalog to find your first course</p>
                    <button className="btn-primary">Browse Courses</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                        <motion.div
                            key={course.course_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="h-48 bg-slate-100 flex items-center justify-center relative">
                                {/* Placeholder for course image */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10" />
                                <BookOpen className="w-12 h-12 text-primary-200" />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-primary-700 shadow-sm">
                                    NVQF L{course.nsqf_level}
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-1">
                                    {course.title}
                                </h3>
                                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                    {course.description}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                            <span>Progress</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${course.progress}%` }}
                                                className="h-full bg-primary-600 rounded-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center text-xs text-slate-500">
                                            <Clock className="w-3.5 h-3.5 mr-1" />
                                            <span>2h remaining</span>
                                        </div>
                                        <button className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                                            <PlayCircle className="w-4 h-4 mr-1.5" />
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCourses;
