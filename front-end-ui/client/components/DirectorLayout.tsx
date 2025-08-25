import React from 'react';
import { useSidebar } from "@/hooks/useSidebar";
import DirectorSidebar from "./DirectorSidebar";
import DirectorHeader from "./DirectorHeader";

interface DirectorLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DirectorLayout({ children, title, subtitle }: DirectorLayoutProps) {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DirectorSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      <div className="flex-1 transition-all duration-300">
        <DirectorHeader isSidebarOpen={isOpen} onMenuClick={() => setIsOpen(!isOpen)} />

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
