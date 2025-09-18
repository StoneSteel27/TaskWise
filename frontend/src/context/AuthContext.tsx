import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials } from '../types';
import { apiService } from '../services/api.provider';
import { setAuthToken } from '../services/api.client';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app start
    const storedUser = localStorage.getItem('taskwise_user');
    const storedToken = localStorage.getItem('taskwise_token');
    
    if (storedUser && storedUser !== 'undefined' && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setAuthToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Use mock API if the flag is set and it's a demo login
      if (import.meta.env.VITE_USE_MOCK_API === 'true' && credentials.password === 'demo123') {
        // Mock login logic
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        let mockUser: User;
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        if (credentials.roll_number === 'principal') {
          mockUser = {
            id: '1',
            name: 'Dr. Sarah Johnson',
            roll_number: 'principal',
            user_type: 'PRINCIPAL',
            profile_picture_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150'
          };
        } else if (credentials.roll_number.startsWith('T')) {
          mockUser = {
            id: '2',
            name: 'Mr. John Doe',
            roll_number: credentials.roll_number,
            user_type: 'TEACHER',
            profile_picture_url: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150'
          };
        } else {
          mockUser = {
            id: '3',
            name: 'Kanishq V',
            roll_number: credentials.roll_number,
            user_type: 'STUDENT',
            classroom: '10-A',
            profile_picture_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
          };
        }
        
        setUser(mockUser);
        setToken(mockToken);
        setAuthToken(mockToken);
        
        localStorage.setItem('taskwise_user', JSON.stringify(mockUser));
        localStorage.setItem('taskwise_token', mockToken);
        
        return true;
      } else {
        // Real API call
        const { token, user } = await apiService.login(credentials);
        
        setUser(user);
        setToken(token);
        setAuthToken(token);
        
        localStorage.setItem('taskwise_user', JSON.stringify(user));
        localStorage.setItem('taskwise_token', token);
        
        return true;
      }
    } catch (error) {
      console.error('Login failed:', error);
      logout(); // Clear any partial login data
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('taskwise_user');
    localStorage.removeItem('taskwise_token');
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
