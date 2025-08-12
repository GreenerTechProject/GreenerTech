import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { AuthProvider } from "./contexts/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import RoleSelection from "./pages/RoleSelection";
import AffiliationRequest from "./pages/AffiliationRequest";
import EmailVerification from "./pages/EmailVerification";
import VerifyEmail from "./pages/VerifyEmail";
import TechnicienRegistration from "./pages/TechnicienRegistration";
import Dashboard from "./pages/Dashboard";
import DirecteurSetup from "./pages/DirecteurSetup";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicienSupDashboard from "./pages/TechnicienSupDashboard";
import TechnicienSupAlerts from "./pages/TechnicienSupAlerts";
import TechnicienSupInterventions from "./pages/TechnicienSupInterventions";
import TechnicienSupLayout from "./components/TechnicienSupLayout";
import Accueil from "./pages/Accueil";
import AlertsPage from "./pages/AlertsPage";
import SurveillancePage from "./pages/SurveillancePage";
import ReportsPage from "./pages/ReportsPage";
import Alerts from "./pages/Alerts";
import Interventions from "./pages/Interventions";
import Surveillance from "./pages/Surveillance";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";
import TechnicienSupProfile from "./pages/TechnicienSupProfile";

// New Director Pages
import NewDirectorDashboard from "./pages/NewDirectorDashboard";
import TechnicianManagement from "./pages/TechnicianManagement";
import DirectorAffiliationManagement from "./pages/DirectorAffiliationManagement";
import DirectorInterventionManagement from "./pages/DirectorInterventionManagement";
import DirectorAlertManagement from "./pages/DirectorAlertManagement";
import DirectorReportManagement from "./pages/DirectorReportManagement";

const queryClient = new QueryClient();

const RoleHomeRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }
  const target = user?.role === "directeur"
    ? (user?.setup_completed ? "/directeur" : "/setup")
    : user?.role === "technicien"
      ? "/technician"
      : user?.role === "technicien_superieur"
        ? "/technicien-sup/map"
        : "/login";
  return <Navigate to={target} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Index />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/register" element={<Register />} />
            <Route path="/affiliation-request" element={<AffiliationRequest />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/technicien-registration" element={<TechnicienRegistration />} />

            {/* Dashboard alias -> role home redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <RoleHomeRedirect />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy Director Dashboard (for setup) */}
             <Route
              path="/setup"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirecteurSetup />
                </ProtectedRoute>
              }
            /> 

            {/* New Director Dashboard with Sidebar */}
            <Route
              path="/directeur"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Director Management Routes */}
            <Route
              path="/director/technicians"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <TechnicianManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/affiliations"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorAffiliationManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/interventions"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorInterventionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/alerts"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorAlertManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/reports"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorReportManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/analytics"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/locations"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Technician Routes */}
            <Route
              path="/technician"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician-dashboard"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician/surveillance"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <Surveillance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician/alerts"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician/interventions"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <Interventions />
                </ProtectedRoute>
              }
            />

            {/* Technicien Sup Routes with Persistent Header */}
            <Route
              path="/technicien-sup"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <TechnicienSupLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TechnicienSupDashboard />} />
              <Route path="map" element={<TechnicienSupDashboard />} />
              <Route path="home" element={<Accueil />} />
              <Route path="dashboard" element={<TechnicienSupDashboard />} />
              <Route path="alerts" element={<TechnicienSupAlerts />} />
              <Route path="interventions" element={<TechnicienSupInterventions />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            <Route
              path="/technicien-sup-dashboard"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <Navigate to="/technicien-sup" replace />
                </ProtectedRoute>
              }
            />

            {/* General Feature Routes */}

            <Route
              path="/surveillance"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <Surveillance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/surveillance-view"
              element={
                <ProtectedRoute requiredRole={["directeur", "technicien"]}>
                  <Surveillance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Profile Routes */}
            <Route
              path="/technicien/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technicien/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technicien-sup/profile"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <TechnicienSupProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technicien-sup/profile/edit"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />

            {/* Redirect root based on role */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RoleHomeRedirect />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
