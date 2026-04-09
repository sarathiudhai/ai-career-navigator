import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Target } from 'lucide-react';
import apiClient from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Progress = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.getLearnerDashboard();
                if (response.success) {
                    setData(response.data);
                } else {
                    setError(response.message);
                }
            } catch (err) {
                setError('Failed to load progress data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    // Transform course progress for chart
    const chartData = data?.courses.map(course => ({
        name: course.title.substring(0, 15) + '...',
        progress: data.course_progress[course.course_id] || 0
    })) || [];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Progress</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-500">Overall Progress</h3>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{data?.overall_progress}%</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-500">Courses Completed</h3>
                        <Award className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {Object.values(data?.course_progress || {}).filter(p => p === 100).length} / {data?.courses.length || 0}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-500">NSQF Level</h3>
                        <Target className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">Level {data?.nsqf_level}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-500">Badges Earned</h3>
                        <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{data?.certifications.length || 0}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-6">Course Performance</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="progress" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity / Detailed List */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-6">Course Breakdown</h3>
                    <div className="space-y-4">
                        {data?.courses.map(course => (
                            <div key={course.course_id} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{course.title}</p>
                                    <p className="text-xs text-slate-500">NSQF Level {course.nsqf_level}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-primary-600">
                                        {data.course_progress[course.course_id] || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;
