import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = "/",
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  console.log("ProtectedRoute - user:", user);
  console.log("ProtectedRoute - isLoading:", isLoading);
  console.log("ProtectedRoute - requiredRole:", requiredRole);
  console.log("ProtectedRoute - current location:", location.pathname);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Helper to compute the default home path for a user's role
  const getHomePathForRole = (): string => {
    if (user?.role === "directeur") {
      return user?.setup_completed ? "/directeur" : "/setup";
    }
    if (user?.role === "technicien") {
      return "/technician";
    }
    if (user?.role === "technicien_superieur") {
      return "/technicien-sup";
    }
    return "/dashboard";
  };

  // Check role-based access if required
  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(user?.role || "")
      : user?.role === requiredRole;
    if (!allowed) {
      return <Navigate to={getHomePathForRole()} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
