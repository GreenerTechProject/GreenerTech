import React from 'react';
import MainNavigation from '../navigation/MainNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      {/* Main Navigation - Always visible, takes up full height */}
      <MainNavigation />
      
      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
