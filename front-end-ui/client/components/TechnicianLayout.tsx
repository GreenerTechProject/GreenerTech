import React from "react";
import { Outlet } from "react-router-dom";
import TechHeader from "./TechHeader";
import { TechnicianSidebarProvider, useTechnicianSidebar } from "../contexts/TechnicianSidebarContext";

function LayoutInner() {
  const { isOpen } = useTechnicianSidebar();
  // Dynamic left padding on desktop to match sidebar width
  const desktopPaddingClass = isOpen
    ? "lg:pl-64 xl:pl-64 2xl:pl-80"
    : "lg:pl-20 xl:pl-20 2xl:pl-20";

  return (
    <div className={"min-h-screen bg-gray-50 " + desktopPaddingClass}>
      <TechHeader role="technicien" />
      <main>
        <div>
          <Outlet />
        </div>
      </main>
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
