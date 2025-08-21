import React from "react";
import { Outlet } from "react-router-dom";
import TechHeader from "./TechHeader";

export default function TechnicianLayout() {
  return (
    <div className="min-h-screen bg-gray-50 lg:pl-20 xl:pl-64 2xl:pl-80">
      <TechHeader role="technicien" />
      <main className="pt-14 sm:pt-16">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
