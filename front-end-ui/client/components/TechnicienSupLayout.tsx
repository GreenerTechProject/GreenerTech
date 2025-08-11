import React from "react";
import { Outlet } from "react-router-dom";
import TechHeader from "./TechHeader";

export default function TechnicienSupLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role="technicien_sup" />
      <main className="pt-0">
        <Outlet />
      </main>
    </div>
  );
}
