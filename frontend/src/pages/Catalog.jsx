import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Clock, BarChart, Filter, Star } from 'lucide-react';
import apiClient from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Catalog = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [enrollingId, setEnrollingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // We'll use getCourseRecommendations to get a personalized list or fallback to all courses
                // But getCourseRecommendations requires user_id.
                // Let's use a simpler GetAllCourses endpoint or similar.
                // apiClient.getAllCourses() is defined in api.js calling /courses/
                const response = await apiClient.getAllCourses();
                if (response.success) {
                    setCourses(response.data.courses || []);
                } else {
                    setError(response.message);
                }
            } catch (err) {
                setError('Failed to load course catalog');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleEnroll = async (courseId) => {
        setEnrollingId(courseId);
        try {
            const response = await apiClient.enrollCourse(courseId);
            if (response.success) {
                alert('Successfully enrolled!');
                navigate('/courses');
            } else {
                alert(response.message || 'Enrollment failed');
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            alert(err.message || 'Enrollment failed');
        } finally {
            setEnrollingId(null);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Course Catalog</h1>
                    <p className="text-slate-600 mt-2">Explore courses to advance your career</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-full"
                    />
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No courses found</h3>
                    <p className="text-slate-600">Try adjusting your search terms</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course, index) => (
                        <motion.div
                            key={course.course_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                        >
                            <div className="h-48 bg-slate-100 relative group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-medium">View Details</span>
                                </div>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-primary-700 shadow-sm">
                                    Level {course.nsqf_level}
                                </div>
                                <div className="flex items-center justify-center h-full">
                                    <BookOpen className="w-12 h-12 text-slate-300" />
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1" title={course.title}>
                                        {course.title}
                                    </h3>
                                    {course.enrollment_stats?.completion_rate > 90 && (
                                        <div className="bg-yellow-100 p-1 rounded">
                                            <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1">
                                    {course.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                    <div className="flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        <span>{course.duration_hours || '10'}h</span>
                                    </div>
                                    <div className="flex items-center">
                                        <BarChart className="w-3.5 h-3.5 mr-1" />
                                        <span>{course.modules?.length || 0} Modules</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleEnroll(course.course_id)}
                                    disabled={enrollingId === course.course_id}
                                    className="btn-primary w-full flex items-center justify-center justify-items-center"
                                >
                                    {enrollingId === course.course_id ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Enroll Now'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Catalog;
