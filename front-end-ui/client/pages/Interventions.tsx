import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InterventionForm from "../components/InterventionForm";
import TechnicianSidebar from "../components/TechnicianSidebar";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function Interventions() {
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const { user } = useAuth();

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    // TODO: Send to backend API
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention saved as draft:", data);
    // TODO: Save draft to backend or local storage
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <TechnicianSidebar
                userRole={(user?.role === "technicien_sup" ? "technicien_sup" : "technicien") as "technicien" | "technicien_sup"}
                onInterventionClick={() => setIsInterventionFormOpen(true)}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interventions</h1>
                <p className="text-sm text-gray-600">Gérez vos interventions</p>
              </div>
            </div>
            
            {/* Add Intervention Button */}
            <Button
              size="sm"
              className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
              onClick={() => {
                console.log("Header button clicked");
                setIsInterventionFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle intervention
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interventions List Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Plus className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune intervention</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par créer votre première intervention.
            </p>
            <div className="mt-6">
              <Button
                size="sm"
                className="bg-[#B4CC5F] hover:bg-[#A3C247] text-white"
                onClick={() => {
                  console.log("Center button clicked");
                  setIsInterventionFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle intervention
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={() => setIsInterventionFormOpen(false)}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />
    </div>
  );
}
