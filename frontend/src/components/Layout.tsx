import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <div>{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopNavigation />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-2 md:p-6 pt-4 md:pt-6 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;