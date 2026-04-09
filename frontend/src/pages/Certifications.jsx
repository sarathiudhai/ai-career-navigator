import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Calendar, ShieldCheck } from 'lucide-react';
import apiClient from '../utils/api';

const Certifications = () => {
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCertifications = async () => {
            try {
                const response = await apiClient.getLearnerDashboard();
                if (response.success) {
                    // Dashboard returns list of IDs or objects. My updated backend returns IDs mainly but I should probably verify. 
                    // Actually updated learner router returns: "certifications": [c.get("certification_id") for c in certifications]
                    // But I want full objects. 
                    // WAIT, I should fix the backend to return full objects in the dashboard if I want to display details here effortlessly.
                    // OR, I can fetch them separately?
                    // The backend code I wrote: "certifications": [c.get("certification_id") for c in certifications]
                    // This is a list of Strings (IDs). This is NOT good for the frontend UI which needs titles and dates.
                    // I will manually fix the backend router in the next step to return full objects, 
                    // OR I can just assume I'll fix it and write frontend to expect objects.
                    // Let's assume I fix backend to return objects.
                    // Actually, let's write frontend to handle both or just expect objects because I WILL fix backend.
                    setCertifications(response.data.certifications || []);
                } else {
                    setError(response.message);
                }
            } catch (err) {
                setError('Failed to load certifications');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCertifications();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Certifications</h1>
                    <p className="text-slate-600 mt-2">Valid proof of your skills and achievements</p>
                </div>
            </div>

            {certifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No certifications yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                        Complete courses to earn industry-recognized certifications and boost your NSQF level.
                    </p>
                    <button className="btn-primary">Go to Courses</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certifications.map((cert, index) => (
                        <motion.div
                            key={cert.certification_id || index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl p-0 shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow"
                        >
                            <div className="relative p-6 flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <Award className="w-32 h-32" />
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
                                        <ShieldCheck className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">NSQF Level</span>
                                        <span className="text-xl font-bold text-primary-700">{cert.nsqf_level || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mb-6 flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-1">{cert.course_id || "Course Name Placeholder"}</h3>
                                    <p className="text-slate-500 text-sm">Issued by AI Career Navigator</p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center text-xs text-slate-500">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        <span>{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : 'Date N/A'}</span>
                                    </div>
                                    <button className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
                                        <Download className="w-4 h-4 mr-1.5" />
                                        Download PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Certifications;
