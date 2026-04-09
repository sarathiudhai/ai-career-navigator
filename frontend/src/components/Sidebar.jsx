import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Target,
  Award,
  BarChart3,
  FileText,
  Bell,
  Search,
  User
} from 'lucide-react';

const Sidebar = ({ userRole, isCollapsed, setIsCollapsed, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const learnerMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: User, label: 'My Profile', href: '/profile-setup' },
    { icon: Search, label: 'Catalog', href: '/catalog' },
    { icon: BookOpen, label: 'My Courses', href: '/courses' },
    { icon: Target, label: 'Learning Path', href: '/path' },
    { icon: Award, label: 'Certificates', href: '/certificates' },
    { icon: BarChart3, label: 'Progress', href: '/progress' },
  ];

  const trainerMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: Users, label: 'Students', href: '/students' },
    { icon: BookOpen, label: 'Courses', href: '/courses' },
    { icon: FileText, label: 'Assessments', href: '/assessments' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  ];

  const policymakerMenuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', active: true },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: TrendingUp, label: 'Skill Gaps', href: '/skill-gaps' },
    { icon: Users, label: 'User Insights', href: '/insights' },
    { icon: FileText, label: 'Reports', href: '/reports' },
  ];

  const menuItems = userRole === 'trainer' ? trainerMenuItems :
    userRole === 'policymaker' ? policymakerMenuItems :
      learnerMenuItems;

  const commonMenuItems = [
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: LogOut, label: 'Logout', action: 'logout' },
  ];

  const sidebarVariants = {
    expanded: {
      width: '280px',
      transition: {
        duration: 0.3,
        ease: [0.04, 0.63, 0.23, 0.99]
      }
    },
    collapsed: {
      width: '80px',
      transition: {
        duration: 0.3,
        ease: [0.04, 0.63, 0.23, 0.99]
      }
    }
  };

  const itemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        delay: 0.1
      }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  const SidebarContent = () => (
    <motion.div
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      className="h-full glass border-r border-slate-200 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <motion.div
            variants={itemVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <motion.span
              variants={itemVariants}
              animate={isCollapsed ? 'collapsed' : 'expanded'}
              className="font-bold text-xl text-slate-900"
            >
              Career Navigator
            </motion.span>
          </motion.div>

          {/* Desktop Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-2">
          <motion.div
            variants={itemVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            className="px-3 py-2"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isCollapsed ? '' : 'Main Menu'}
            </span>
          </motion.div>

          {menuItems.map((item, index) => (
            <motion.a
              key={item.href}
              href={item.href}
              variants={itemVariants}
              animate={isCollapsed ? 'collapsed' : 'expanded'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`sidebar-item ${item.active ? 'sidebar-item-active' : ''}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                variants={itemVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                className="whitespace-nowrap"
              >
                {item.label}
              </motion.span>
              {item.active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute right-2 w-2 h-2 bg-primary-600 rounded-full"
                />
              )}
            </motion.a>
          ))}
        </div>

        {/* Common Items */}
        <div className="space-y-2 pt-6 border-t border-slate-200">
          <motion.div
            variants={itemVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            className="px-3 py-2"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isCollapsed ? '' : 'System'}
            </span>
          </motion.div>

          {commonMenuItems.map((item) => (
            item.action === 'logout' ? (
              <button
                key={item.action}
                onClick={() => {
                  // Direct logout without any complex logic
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="sidebar-item w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 font-medium"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isCollapsed ? '' : (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </button>
            ) : (
              <motion.a
                key={item.href}
                href={item.href}
                variants={itemVariants}
                animate={isCollapsed ? 'collapsed' : 'expanded'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="sidebar-item"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  variants={itemVariants}
                  animate={isCollapsed ? 'collapsed' : 'expanded'}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              </motion.a>
            )
          ))}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-200">
        <motion.div
          variants={itemVariants}
          animate={isCollapsed ? 'collapsed' : 'expanded'}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-semibold">
              {userRole === 'trainer' ? 'T' : userRole === 'policymaker' ? 'P' : 'L'}
            </span>
          </div>
          <motion.div
            variants={itemVariants}
            animate={isCollapsed ? 'collapsed' : 'expanded'}
            className="flex-1 min-w-0"
          >
            <p className="font-medium text-slate-900 capitalize">{userRole}</p>
            <p className="text-xs text-slate-500 truncate">user@example.com</p>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">Career Navigator</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Search className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72"
            >
              <div className="h-full bg-white">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-bold text-lg text-slate-900">Career Navigator</span>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <SidebarContent />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
