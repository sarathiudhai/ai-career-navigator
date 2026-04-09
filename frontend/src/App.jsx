import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';

import LearnerDashboard from './pages/LearnerDashboard';
import PolicymakerDashboard from './pages/PolicymakerDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import TrainerAnalytics from './pages/TrainerAnalytics';
import AssessmentPlayer from './pages/AssessmentPlayer';
import Sidebar from './components/Sidebar';
import MyCourses from './pages/MyCourses';
import LearningPath from './pages/LearningPath';
import Certifications from './pages/Certifications';
import Progress from './pages/Progress';
import Catalog from './pages/Catalog';
import TrainerStudents from './pages/TrainerStudents';
import TrainerCourses from './pages/TrainerCourses';
import TrainerAssessments from './pages/TrainerAssessments';
import AIChatBot from './components/AIChatBot';
import TrainerSettings from './pages/TrainerSettings';
import PolicymakerAnalytics from './pages/PolicymakerAnalytics';
import PolicymakerSkillGaps from './pages/PolicymakerSkillGaps';
import PolicymakerUserInsights from './pages/PolicymakerUserInsights';
import PolicymakerReports from './pages/PolicymakerReports';
import PolicymakerSettings from './pages/PolicymakerSettings';
import LearnerSettings from './pages/LearnerSettings';

// Mock Auth Context
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // Call backend logout
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // Use window.location.replace for immediate redirect
      window.location.replace('/login');
    }
  };

  return { user, login, logout, isLoading };
};

// Protected Route Component
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force first_login users to profile setup unless they are already there
  if (user.first_login && window.location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
};

// Layout Component for authenticated pages
const AuthenticatedLayout = ({ user, children, logout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar
        userRole={user?.role || 'learner'}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogout={logout}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <AIChatBot user={user} />
    </div>
  );
};

// Page Transition Component
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

function App() {
  const { user, login, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                user.first_login ? (
                  <Navigate to="/profile-setup" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              ) : (
                <PageTransition>
                  <Login onLogin={login} />
                </PageTransition>
              )
            }
          />

          <Route
            path="/profile-setup"
            element={
              user ? (
                <ProtectedRoute user={user}>
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <ProfileSetup user={user} onProfileComplete={(updatedUser) => {
                        login(updatedUser);
                        if (user.first_login) {
                          // If it was first login, redirect to dashboard after saving
                          window.location.href = '/dashboard';
                        }
                      }} />
                    </PageTransition>
                  </AuthenticatedLayout>
                </ProtectedRoute>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                {user?.first_login ? (
                  <Navigate to="/profile-setup" replace />
                ) : (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      {user?.role === 'policymaker' ? (
                        <PolicymakerDashboard />
                      ) : user?.role === 'trainer' ? (
                        <TrainerDashboard />
                      ) : (
                        <LearnerDashboard />
                      )}
                    </PageTransition>
                  </AuthenticatedLayout>
                )}
              </ProtectedRoute>
            }
          />



          {/* Learner Routes */}
          <Route
            path="/catalog"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    <Catalog />
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    {user?.role === 'trainer' ? <TrainerCourses userRole={user.role} /> : <MyCourses />}
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/path"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    <LearningPath />
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/certificates"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    <Certifications />
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    <Progress />
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Trainer Routes */}
          <Route
            path="/students"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'trainer' || user?.role === 'policymaker' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <TrainerStudents />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessments"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'trainer' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <TrainerAssessments userRole={user.role} />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          {/* Policymaker Routes */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'trainer' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <TrainerAnalytics />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : user?.role === 'policymaker' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <PolicymakerAnalytics />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/skill-gaps"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'policymaker' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <PolicymakerSkillGaps />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/insights"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'policymaker' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <PolicymakerUserInsights />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute user={user}>
                {user?.role === 'policymaker' ? (
                  <AuthenticatedLayout user={user} logout={logout}>
                    <PageTransition>
                      <PolicymakerReports />
                    </PageTransition>
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user}>
                <AuthenticatedLayout user={user} logout={logout}>
                  <PageTransition>
                    {user?.role === 'trainer' ? (
                      <TrainerSettings />
                    ) : user?.role === 'policymaker' ? (
                      <PolicymakerSettings />
                    ) : (
                      <LearnerSettings />
                    )}
                  </PageTransition>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route
            path="/"
            element={
              <Navigate to={user ? "/dashboard" : "/login"} replace />
            }
          />

          {/* Catch all route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-slate-900 mb-4">404</h1>
                  <p className="text-slate-600 mb-8">Page not found</p>
                  <button
                    onClick={() => window.history.back()}
                    className="btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
