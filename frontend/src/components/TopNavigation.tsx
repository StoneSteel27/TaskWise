import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, GraduationCap } from 'lucide-react';

const TopNavigation: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="md:hidden flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
           <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">TaskWise</span>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* User menu */}
          <div className="flex items-center space-x-3">
            <img
              src={user?.profile_picture_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavigation;