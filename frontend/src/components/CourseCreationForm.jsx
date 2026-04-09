import { useState } from 'react';
import { BookOpen, Plus, X, Trash2 } from 'lucide-react';

const CourseCreationForm = ({ onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        nsqf_level: 1,
        duration_weeks: 8,
        prerequisites: [],
        skills_gained: [],
    });

    const [modules, setModules] = useState([
        { title: '', description: '', duration_hours: '', order: 1 }
    ]);

    const [currentPrerequisite, setCurrentPrerequisite] = useState('');
    const [currentSkill, setCurrentSkill] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'nsqf_level' || name === 'duration_weeks' ? parseInt(value) || 0 : value
        }));
    };

    const addPrerequisite = () => {
        if (currentPrerequisite.trim() && !formData.prerequisites.includes(currentPrerequisite.trim())) {
            setFormData(prev => ({
                ...prev,
                prerequisites: [...prev.prerequisites, currentPrerequisite.trim()]
            }));
            setCurrentPrerequisite('');
        }
    };

    const removePrerequisite = (index) => {
        setFormData(prev => ({
            ...prev,
            prerequisites: prev.prerequisites.filter((_, i) => i !== index)
        }));
    };

    const addSkill = () => {
        if (currentSkill.trim() && !formData.skills_gained.includes(currentSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills_gained: [...prev.skills_gained, currentSkill.trim()]
            }));
            setCurrentSkill('');
        }
    };

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills_gained: prev.skills_gained.filter((_, i) => i !== index)
        }));
    };

    const handleAddModule = () => {
        setModules([...modules, { title: '', description: '', duration_hours: '', order: modules.length + 1 }]);
    };

    const handleRemoveModule = (index) => {
        if (modules.length > 1) {
            setModules(modules.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i + 1 })));
        }
    };

    const handleModuleChange = (index, field, value) => {
        const newModules = [...modules];
        newModules[index][field] = value;
        setModules(newModules);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.description || !formData.nsqf_level) {
            alert("Please fill in all required fields.");
            return;
        }

        // Prepare data matching backend schema
        const payload = {
            ...formData,
            nsqf_level: parseInt(formData.nsqf_level),
            modules: modules.map(m => ({
                ...m,
                duration_hours: parseInt(m.duration_hours) || 0
            }))
        };

        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Course Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g., Python Programming Fundamentals"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            NSQF Level *
                        </label>
                        <select
                            name="nsqf_level"
                            value={formData.nsqf_level}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                                <option key={level} value={level}>Level {level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                        placeholder="Describe what students will learn in this course..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Duration (weeks)
                        </label>
                        <input
                            type="number"
                            name="duration_weeks"
                            value={formData.duration_weeks}
                            onChange={handleInputChange}
                            min="1"
                            max="52"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="8"
                        />
                    </div>
                </div>
            </div>

            {/* Prerequisites */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Prerequisites</h3>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={currentPrerequisite}
                        onChange={(e) => setCurrentPrerequisite(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Add a prerequisite and press Enter"
                    />
                    <button
                        type="button"
                        onClick={addPrerequisite}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.prerequisites.map((prereq, index) => (
                        <span
                            key={index}
                            className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                            {prereq}
                            <button
                                type="button"
                                onClick={() => removePrerequisite(index)}
                                className="text-amber-500 hover:text-amber-700"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Skills Gained */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Skills Gained</h3>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Add a skill and press Enter"
                    />
                    <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {formData.skills_gained.map((skill, index) => (
                        <span
                            key={index}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                            {skill}
                            <button
                                type="button"
                                onClick={() => removeSkill(index)}
                                className="text-green-500 hover:text-green-700"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Course Modules */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Modules</h3>
                <div className="space-y-4">
                    {modules.map((module, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group">
                            <button
                                type="button"
                                onClick={() => handleRemoveModule(index)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={modules.length === 1}
                            >
                                <Trash2 size={16} />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <input
                                    type="text"
                                    value={module.title}
                                    onChange={(e) => handleModuleChange(index, 'title', e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                    placeholder="Module Title"
                                    required
                                />
                                <input
                                    type="number"
                                    value={module.duration_hours}
                                    onChange={(e) => handleModuleChange(index, 'duration_hours', e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                    placeholder="Duration (Hours)"
                                />
                            </div>
                            <input
                                type="text"
                                value={module.description}
                                onChange={(e) => handleModuleChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                placeholder="Module Description"
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddModule}
                        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus size={20} />
                        Add Module
                    </button>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-4 h-4" />
                            Create Course
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default CourseCreationForm;
