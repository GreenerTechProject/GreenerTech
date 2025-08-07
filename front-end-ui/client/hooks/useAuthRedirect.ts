import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Hook to redirect authenticated users away from auth pages (login, register)
 */
export const useAuthRedirect = (redirectTo: string = "/dashboard") => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect users based on their role
      if (user?.role === "directeur" && user?.setup_completed) {
        navigate("/directeur", { replace: true });
      } else  if (user?.role === "directeur" && !user?.setup_completed) {
        navigate("/setup", { replace: true });
      }
      else if (user?.role === "technicien") {
        navigate("/technician", { replace: true });
      } else if (user?.role === "technicien_superieur") {
        navigate("/technicien-sup", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, user?.role]);

  return { isLoading, isAuthenticated };
};

/**
 * Hook to require authentication and redirect if not authenticated
 */
export const useRequireAuth = (redirectTo: string = "/login") => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isLoading, isAuthenticated, user };
};
