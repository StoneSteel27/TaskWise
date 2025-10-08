import React, { useState } from 'react';
import { useAuth, User } from '../context/AuthContext';
import Home from 'lucide-react/dist/esm/icons/home';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Users from 'lucide-react/dist/esm/icons/users';
import { Link } from 'react-router-dom';
import CoursesModal from '../features/courses/CoursesModal';
import AttendanceMenuModal from '../features/attendance/AttendanceMenuModal';

interface SidebarItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  userTypes: string[];
  hideIf?: (user: User | null) => boolean;
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isCoursesModalOpen, setCoursesModalOpen] = useState(false);
  const [isAttendanceMenuOpen, setAttendanceMenuOpen] = useState(false);

  const sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: Home, href: '/dashboard', userTypes: ['STUDENT', 'TEACHER', 'PRINCIPAL', 'ADMIN'] },
    { label: 'Courses', icon: BookOpen, action: () => setCoursesModalOpen(true), userTypes: ['STUDENT', 'TEACHER'] },
    // Student-specific attendance link
    { label: 'Attendance', icon: UserCheck, href: '/attendance', userTypes: ['STUDENT'] },
    // Teacher-specific attendance action
    { label: 'Attendance', icon: UserCheck, action: () => setAttendanceMenuOpen(true), userTypes: ['TEACHER'] },
    { 
      label: 'Students', 
      icon: Users, 
      href: '/students', 
      userTypes: ['TEACHER'], 
      hideIf: (user) => !user?.homeroom_class 
    },
  ];

  const filteredItems = sidebarItems.filter(item => {
    const userType = user?.user_type?.toUpperCase() || '';
    if (!item.userTypes.includes(userType)) {
      return false;
    }
    if (item.hideIf && item.hideIf(user)) {
      return false;
    }
    return true;
  });

  const renderNavItem = (item: SidebarItem) => {
    const commonProps = {
      key: item.label,
      className: "flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
    };

    if (item.href) {
      return (
        <Link to={item.href} {...commonProps}>
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </Link>
      );
    }

    return (
      <div onClick={item.action} {...commonProps}>
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </div>
    );
  };

  const renderMobileNavItem = (item: SidebarItem) => {
    const commonProps = {
      key: item.label,
      className: "flex flex-col items-center justify-center w-full text-gray-600 hover:text-blue-600"
    };

    if (item.href) {
      return (
        <Link to={item.href} {...commonProps}>
          <item.icon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      );
    }

    return (
      <div onClick={item.action} {...commonProps}>
        <item.icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{item.label}</span>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-800">TaskWise</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredItems.map(renderNavItem)}
      </nav>

      <div className="hidden md:flex p-4 border-t border-gray-200">
        <div className="flex items-center justify-between w-full">
          <Link to={`/student/${user.roll_number}`} className="flex items-center space-x-3">
            <img
              src={user?.profile_picture_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.user_type}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <nav className="flex justify-around py-2">
          {filteredItems.map(renderMobileNavItem)}
        </nav>
      </div>
      
      <CoursesModal isOpen={isCoursesModalOpen} onClose={() => setCoursesModalOpen(false)} />
      <AttendanceMenuModal isOpen={isAttendanceMenuOpen} onClose={() => setAttendanceMenuOpen(false)} />
    </>
  );
};

export default Sidebar;