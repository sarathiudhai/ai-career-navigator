import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, GraduationCap, Briefcase, ArrowRight, Save, Lock } from 'lucide-react';
import apiClient from '../utils/api';

const ProfileSetup = ({ user, onProfileComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: 18,
    education: 'secondary',
    skills: [],
    experience: 0,
    region: '',
    targetCareer: ''
  });
  const [initialTargetCareer, setInitialTargetCareer] = useState(null); // For locking logic
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [skillInput, setSkillInput] = useState('');

  const educationOptions = [
    { value: 'no_formal_education', label: 'No Formal Education' },
    { value: 'primary', label: 'Primary School' },
    { value: 'secondary', label: 'Secondary School' },
    { value: 'higher_secondary', label: 'Higher Secondary' },
    { value: 'diploma', label: 'Diploma' },
    { value: 'bachelors', label: 'Bachelor\'s Degree' },
    { value: 'masters', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD' },
    { value: 'post_doc', label: 'Post Doctorate' }
  ];

  const careerOptions = [
    'Software Developer',
    'Data Scientist',
    'Mobile Developer',
    'UI/UX Designer',
    'DevOps Engineer',
    'System Administrator',
    'Network Engineer',
    'Database Administrator',
    'Cloud Architect',
    'AI/ML Engineer',
    'Cybersecurity Analyst',
    'Project Manager',
    'Technical Writer',
    'Quality Assurance Engineer',
    'Business Analyst'
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiClient.createLearnerProfile({
        name: formData.name,
        age: formData.age,
        education: formData.education,
        skills: formData.skills,
        experience: formData.experience,
        region: formData.region,
        target_career: formData.targetCareer
      });

      if (response && response.success) {
        // Update user data to reflect first_login is now false
        const updatedUser = { ...user, first_login: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        onProfileComplete(updatedUser);
        console.log('Profile setup successful:', response);
      } else {
        console.error('Profile setup failed:', response);
        alert(response?.message || 'Profile setup failed');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      alert(error.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h1>
            <p className="text-slate-600">Help us personalize your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="16"
                  max="100"
                  required
                  className="input-field"
                  placeholder="Your age"
                />
              </div>
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <GraduationCap className="w-4 h-4 inline mr-2" />
                Highest Education
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                {educationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Years of Experience
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                max="50"
                required
                className="input-field"
                placeholder="Years of professional experience"
              />
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Region
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                required
                className="input-field"
                placeholder="Your city or region"
              />
            </div>

            {/* Target Career */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Career
              </label>
              <select
                name="targetCareer"
                value={formData.targetCareer}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select your target career</option>
                {careerOptions.map(career => (
                  <option key={career} value={career}>
                    {career}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Skills
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                  className="input-field flex-1"
                  placeholder="Add a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={handleSkillAdd}
                  className="btn-secondary px-4 py-3"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <span
                    key={skill}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleSkillRemove(skill)}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
