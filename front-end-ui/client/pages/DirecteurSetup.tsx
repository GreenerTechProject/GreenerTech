import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import DirectorSetupFlow from "../components/DirectorSetupFlow";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function DirecteurSetup() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Flow Logic: On Director Login
  useEffect(() => {
    if (user) {
      // Check if user has the correct role
      if (user.role !== "directeur") {
        // Redirect non-directeur users back to general dashboard
        navigate("/dashboard");
        return;
      }

      // Check setup_completed
      if (user.setup_completed === true) {
        // If true → redirect to newDirectorDashboard
        navigate("/directeur");
        return;
      } else {
        // If false → start the setup wizard
        setIsLoading(false);
      }
    }
  }, [user, navigate]);

  const handleSetupComplete = () => {
    // Redirect to newDirectorDashboard after setup completion
    navigate("/directeur");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show setup wizard if user setup is not completed
  if (!user?.setup_completed) {
    return <DirectorSetupFlow onComplete={handleSetupComplete} />;
  }

  // This should never be reached due to the useEffect redirect above
  // but keeping as fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}