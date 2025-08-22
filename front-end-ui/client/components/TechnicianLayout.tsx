import React from "react";
import { Outlet } from "react-router-dom";
import TechHeader from "./TechHeader";
import TechnicianSidebar from "./TechnicianSidebar";
import { TechnicianSidebarProvider, useTechnicianSidebar } from "../contexts/TechnicianSidebarContext";

function LayoutInner() {
  const { isOpen, setIsOpen } = useTechnicianSidebar();
  const desktopPaddingClass = isOpen
    ? "lg:pl-64 xl:pl-64 2xl:pl-80"
    : "lg:pl-20 xl:pl-20 2xl:pl-20";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TechnicianSidebar userRole="technicien" />
      <div className={`flex-1 transition-all duration-300 ${desktopPaddingClass}`}>
        <TechHeader 
          role="technicien" 
          onMenuClick={() => setIsOpen(!isOpen)}
          isSidebarOpen={isOpen}
        />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function TechnicianLayout() {
  return (
    <TechnicianSidebarProvider>
      <LayoutInner />
    </TechnicianSidebarProvider>
  );
}
