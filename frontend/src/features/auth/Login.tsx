import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { showErrorToast } from '../../utils/notifications';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    roll_number: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.roll_number || !credentials.password) {
      showErrorToast('Please fill in all fields');
      return;
    }

    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showErrorToast(err.message);
      } else {
        showErrorToast('An unknown error occurred.');
      }
    }
  };

  const handleDemoLogin = (userType: string) => {
    let rollNumber = '';
    switch (userType) {
      case 'student':
        rollNumber = 'student_10A_1';
        break;
      case 'teacher':
        rollNumber = 'teacher1';
        break;
      case 'principal':
        rollNumber = 'principal';
        break;
    }
    setCredentials({ roll_number: rollNumber, password: 'password' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">TaskWise</h1>
          <p className="text-gray-600 mt-2">School Tasks and Attendance System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="roll_number" className="block text-sm font-medium text-gray-700 mb-2">
                Roll Number
              </label>
              <input
                id="roll_number"
                type="text"
                value={credentials.roll_number}
                onChange={(e) => setCredentials({ ...credentials, roll_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your roll number"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">Demo Accounts:</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleDemoLogin('student')}
                className="w-full bg-green-50 text-green-700 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                Student Demo
              </button>
              <button
                onClick={() => handleDemoLogin('teacher')}
                className="w-full bg-orange-50 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
              >
                Teacher Demo
              </button>
              <button
                onClick={() => handleDemoLogin('principal')}
                className="w-full bg-purple-50 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
              >
                Principal Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2025 TaskWise. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;