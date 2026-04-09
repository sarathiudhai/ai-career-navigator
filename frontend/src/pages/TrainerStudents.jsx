import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    Filter,
    ArrowRight,
    Loader2,
    BookOpen,
    Target,
} from 'lucide-react';
import apiClient from '../utils/api';

const TrainerStudents = () => {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiClient.getTrainerStudents();
            if (response.success) {
                setStudents(response.data.students || []);
            } else {
                throw new Error(response.message || 'Failed to fetch students');
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading students data...</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Students</h1>
                    <p className="text-slate-600">
                        Manage and track progress of learners enrolled in your courses.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64"
                        />
                    </div>
                    <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <Filter className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {error ? (
                <div className="card bg-red-50 border-red-200 text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Connection Error</h3>
                    <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
                    <button onClick={fetchStudents} className="btn-primary bg-red-600 hover:bg-red-700">
                        Try Again
                    </button>
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No students found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        {searchTerm ? `No results for "${searchTerm}"` : "You don't have any students assigned yet."}
                    </p>
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="mt-4 text-primary-600 font-medium hover:underline">
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden border-none shadow-sm bg-white/50 backdrop-blur-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Learner</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Domain</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">NSQF Level</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Courses</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Progress</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <motion.tr
                                        key={student.user_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-900">{student.name}</div>
                                                    <div className="text-xs text-slate-500">{student.age} years old</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-700">
                                                {student.domain}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Target className="w-4 h-4 text-primary-600" />
                                                <span className="font-medium text-slate-900">Level {student.nsqf_level}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                                <span>{student.course_count} Courses</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-32">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-slate-500">Avg. Progress</span>
                                                    <span className="font-medium text-slate-900">{student.overall_progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                    <motion.div
                                                        className="bg-primary-600 h-1.5 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${student.overall_progress}%` }}
                                                        transition={{ duration: 1 }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerStudents;
