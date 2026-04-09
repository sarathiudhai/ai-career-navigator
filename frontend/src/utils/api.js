// API utility for making authenticated requests to the backend

const API_BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized (token expired)
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email, password, role) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role })
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Learner endpoints
  async createLearnerProfile(profileData) {
    return this.request('/learners/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }

  async getLearnerProfile() {
    return this.request('/learners/profile');
  }

  async calculateNSQFLevel(profileDetails) {
    return this.request('/learners/calculate-nsqf', {
      method: 'POST',
      body: JSON.stringify(profileDetails)
    });
  }

  async enrollCourse(courseId) {
    return this.request(`/learners/enroll-course/${courseId}`, {
      method: 'POST'
    });
  }

  async updateCourseProgress(courseId, progress) {
    return this.request(`/learners/update-progress/${courseId}?progress=${progress}`, {
      method: 'POST'
    });
  }

  async getLearnerDashboard() {
    return this.request('/learners/dashboard');
  }

  async getLearnerRoadmap() {
    return this.request('/learners/roadmap');
  }

  async getCourseRecommendations() {
    return this.request('/learners/recommendations');
  }

  async getLearnerAssessments(courseId) {
    return this.request(`/learners/courses/${courseId}/assessments`);
  }

  async submitAssessment(assessmentId, answers) {
    return this.request(`/learners/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  // Trainer endpoints
  async createCourse(courseData) {
    return this.request('/trainers/courses', {
      method: 'POST',
      body: JSON.stringify(courseData)
    });
  }

  async getTrainerCourses() {
    return this.request('/trainers/courses');
  }

  async deleteTrainerCourse(courseId) {
    return this.request(`/trainers/courses/${courseId}`, {
      method: 'DELETE',
    });
  }

  async getAssignedLearners() {
    return this.request('/trainers/learners');
  }

  async assignLearner(learnerId) {
    return this.request(`/trainers/assign-learner/${learnerId}`, {
      method: 'POST'
    });
  }

  async updateLearnerProgress(learnerId, courseId, progress) {
    return this.request(`/trainers/update-learner-progress/${learnerId}/${courseId}`, {
      method: 'POST',
      body: JSON.stringify({ progress })
    });
  }

  async getTrainerAnalytics(time_range = 'all', course_id = null) {
    let url = `/trainers/analytics?time_range=${time_range}`;
    if (course_id) url += `&course_id=${course_id}`;
    return this.request(url);
  }

  async getTrainerStudents() {
    return this.request('/trainers/students');
  }

  async getCourseAnalytics(courseId) {
    return this.request(`/trainers/courses/${courseId}/analytics`);
  }

  async getCourseStudents(courseId) {
    return this.request(`/trainers/courses/${courseId}/students`);
  }

  // Trainer Settings
  async getTrainerSettings() { return this.request('/trainers/settings'); }
  async updateProfileSettings(data) { return this.request('/trainers/settings/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async updateNotificationSettings(data) { return this.request('/trainers/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }); }
  async updateTeachingSettings(data) { return this.request('/trainers/settings/teaching', { method: 'PUT', body: JSON.stringify(data) }); }
  async updateAISettings(data) { return this.request('/trainers/settings/ai', { method: 'PUT', body: JSON.stringify(data) }); }
  async updatePrivacySettings(data) { return this.request('/trainers/settings/privacy', { method: 'PUT', body: JSON.stringify(data) }); }
  async updateDashboardSettings(data) { return this.request('/trainers/settings/dashboard-prefs', { method: 'PUT', body: JSON.stringify(data) }); }
  async changePassword(data) { return this.request('/trainers/settings/change-password', { method: 'POST', body: JSON.stringify(data) }); }
  async exportTrainerData() { return this.request('/trainers/settings/export-data'); }

  // Policymaker endpoints
  async getSystemAnalytics() { return this.request('/policymakers/analytics'); }
  async getSkillGapAnalysis() { return this.request('/policymakers/skill-gaps'); }
  async getUserInsights() { return this.request('/policymakers/user-insights'); }
  async getSystemSummaryReport() { return this.request('/policymakers/reports/system-summary'); }
  async exportAllPlatformData() { return this.request('/policymakers/reports/export-all'); }
  async getPolicymakerSettings() { return this.request('/policymakers/settings'); }
  async updatePolicymakerProfile(data) { return this.request('/policymakers/settings/profile', { method: 'PUT', body: JSON.stringify(data) }); }
  async updatePolicymakerNotifications(data) { return this.request('/policymakers/settings/notifications', { method: 'PUT', body: JSON.stringify(data) }); }
  async changePolicymakerPassword(data) { return this.request('/policymakers/settings/change-password', { method: 'POST', body: JSON.stringify(data) }); }
  async getPolicymakerDashboard() { return this.request('/policymakers/dashboard'); }

  // Course endpoints
  async getAllCourses(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/courses/?${params}`);
  }

  async getCourseDetails(courseId) {
    return this.request(`/courses/${courseId}`);
  }

  async updateCourse(courseId, courseData) {
    return this.request(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(courseData)
    });
  }

  async deleteCourse(courseId) {
    return this.request(`/courses/${courseId}`, {
      method: 'DELETE'
    });
  }

  async getCourseModules(courseId) {
    return this.request(`/courses/${courseId}/modules`);
  }

  async addCourseModule(courseId, moduleData) {
    return this.request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData)
    });
  }

  async getCourseRecommendations(userId) {
    return this.request(`/courses/recommendations/${userId}`);
  }

  // AI Chat endpoints
  async chatCareer(message, history = []) {
    return this.request('/ai-chat/career-coach', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }

  async chatCourse(courseId, message, history = []) {
    return this.request(`/ai-chat/course-assistant/${courseId}`, {
      method: 'POST',
      body: JSON.stringify({ message, history })
    });
  }

  async generateQuestions(data) {
    return this.request('/ai-chat/generate_questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async analyzeWeakness(studentId) {
    return this.request(`/ai-chat/analyze_weakness/${studentId}`);
  }

  async courseImprovementSuggestions(courseId) {
    return this.request(`/ai-chat/course_improvement/${courseId}`);
  }

  async getTrainerAIInsights(payload) {
    return this.request('/ai-chat/trainer-insights', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Assessment endpoints
  async createAssessment(courseId, assessmentData) {
    return this.request(`/trainers/assessments`, {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId, ...assessmentData })
    });
  }

  async getAssessments(courseId) {
    return this.request(`/trainers/courses/${courseId}/assessments`);
  }

  async getAssessmentAnalytics(assessmentId) {
    return this.request(`/trainers/assessments/${assessmentId}/analytics`);
  }

  async gradeManualAssessmentSubmission(submissionId, gradeData) {
    return this.request(`/trainers/assessments/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(gradeData)
    });
  }

  async submitAssessment(courseId, assessmentId, submission) {
    return this.request(`/courses/${courseId}/assessments/${assessmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  }

  // ── Learner Settings ────────────────────────────────────────
  async getLearnerSettings() {
    return this.request('/learners/settings');
  }

  async updateLearnerProfile(data) {
    return this.request('/learners/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateLearnerNotifications(data) {
    return this.request('/learners/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async updateLearnerPreferences(data) {
    return this.request('/learners/settings/preferences', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async learnerChangePassword(data) {
    return this.request('/learners/settings/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;
