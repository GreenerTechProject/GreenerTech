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
import DirecteurSetup from "./pages/DirecteurSetup";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicianMap from "./pages/TechnicianMap";
import TechnicianLayout from "./components/TechnicianLayout";
import TechnicienSupDashboard from "./pages/TechnicienSupDashboard";
import TechnicienSupHome from "./pages/TechnicienSupHome";
import TechnicienSupAlerts from "./pages/TechnicienSupAlerts";
import TechnicienSupInterventions from "./pages/TechnicienSupInterventions";
import TechnicienSupReports from "./pages/TechnicienSupReports";
import TechnicienSupLayout from "./components/TechnicienSupLayout";
import TechnicienSupAuthorizations from "./pages/TechnicienSupAuthorizations";
import TechnicienSupTeamManagement from "./pages/TechnicienSupTeamManagement";
import Accueil from "./pages/Accueil";
import ReportsPage from "./pages/ReportsPage";
import Alerts from "./pages/Alerts";
import Interventions from "./pages/Interventions";
import Surveillance from "./pages/Surveillance";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";
import TechnicienSupProfile from "./pages/TechnicienSupProfile";
import LandingPage from "./pages/LandingPage";

// New Director Pages
import NewDirectorDashboard from "./pages/NewDirectorDashboard";
import TechnicianManagement from "./pages/TechnicianManagement";
import DirectorAffiliationManagement from "./pages/DirectorAffiliationManagement";
import DirectorInterventionManagement from "./pages/DirectorInterventionManagement";
import DirectorAlertManagement from "./pages/DirectorAlertManagement";
import DirectorAlertMap from "./pages/DirectorAlertMap";
import DirectorReportManagement from "./pages/DirectorReportManagement";
import DirectorProfile from "./pages/DirectorProfile";
import DirectorProfileEdit from "./pages/DirectorProfileEdit";
import DirectorMapConfig from "./pages/DirectorMapConfig";
import DirectorHeader from "./components/DirectorHeader";
import { MissionManagement } from "./pages/MissionManagement";
import RobotControl from "./pages/RobotControl";
import TechnicianReportsPage from "./pages/TechnicianReportsPage";
import TechnicianReportCreation from "./pages/TechnicianReportCreation";
import TechSupNotificationsPage from "./pages/TechSupNotificationsPage";
import AssignmentManagement from "./pages/AssignmentManagement";
import RobotConfig from "./pages/RobotConfig";
import CompanyUpdate from "./pages/CompanyUpdate";
import InterventionRequestDetails from "./pages/InterventionRequestDetails";
import DirectorParameters from "./pages/DirectorParameters";
import DirectorPermissionsAssignments from "./pages/DirectorPermissionsAssignments";

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
        : "/";  // Fallback to landing page, NOT /login
  return <Navigate to={target} replace />;
};

const RootRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to their dashboard
  if (user && user.role) {
    return <RoleHomeRedirect />;
  }

  // If user is not authenticated, show the landing page
  return <LandingPage />;
};

const App = () => {
  return (
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

            {/* Director Map Configuration */}
            <Route
              path="/directeur/map-config"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorMapConfig />
                </ProtectedRoute>
              }
            />

            {/* Robot Configuration */}
            <Route
              path="/directeur/robot-config"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <RobotConfig />
                </ProtectedRoute>
              }
            />

            {/* Company Update */}
            <Route
              path="/directeur/company-update"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <CompanyUpdate />
                </ProtectedRoute>
              }
            />

            {/* Director Profile Routes */}
            <Route
              path="/directeur/profile"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/directeur/profile/edit"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorProfileEdit />
                </ProtectedRoute>
              }
            />

            {/* Director Parameters */}
            <Route
              path="/directeur/parameters"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorParameters />
                </ProtectedRoute>
              }
            />

            {/* Director Permissions and Assignments */}
            <Route
              path="/directeur/permissions-assignments"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorPermissionsAssignments />
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
              path="/director/alerts/:alertId/map"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <DirectorAlertMap />
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
              path="/director/missions"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <MissionManagement />
                </ProtectedRoute>
              }
            />

            {/* Robot Configuration */}
            <Route
              path="/directeur/robot-config"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <RobotConfig />
                </ProtectedRoute>
              }
            />

            {/* Company Update */}
            <Route
              path="/directeur/company-update"
              element={
                <ProtectedRoute requiredRole="directeur">
                  <CompanyUpdate />
                </ProtectedRoute>
              }
            />


            {/* Technician Routes wrapped with TechnicianLayout to always render header */}
            <Route
              path="/technician"
              element={
                <ProtectedRoute requiredRole="technicien">
                  <TechnicianLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TechnicianMap />} />
              <Route path="map" element={<Navigate to="/technician" replace />} />
              <Route path="dashboard" element={<TechnicianDashboard />} />
              <Route path="robot-control" element={<RobotControl />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="interventions" element={<Interventions />} />
              <Route path="missions" element={<MissionManagement />} />
              <Route path="reports" element={<TechnicianReportsPage />} />
              <Route path="reports/create" element={<TechnicianReportCreation />} />
              <Route path="notifications" element={<TechSupNotificationsPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
            </Route>

            {/* Technicien Sup Routes wrapped with TechnicienSupLayout */}
            <Route
              path="/technicien-sup"
              element={
                <ProtectedRoute requiredRole="technicien_superieur">
                  <TechnicienSupLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TechnicienSupHome />} />
              <Route path="home" element={<TechnicienSupHome />} />
              <Route path="map" element={<TechnicienSupDashboard />} />
              <Route path="alerts" element={<TechnicienSupAlerts />} />
              <Route path="interventions" element={<TechnicienSupInterventions />} />
              <Route path="intervention-request/:id" element={<InterventionRequestDetails />} />
              <Route path="reports" element={<TechnicienSupReports />} />
              <Route path="reports/create" element={<TechnicianReportCreation />} />
              <Route path="authorizations" element={<TechnicienSupAuthorizations />} />
              <Route path="team" element={<TechnicienSupTeamManagement />} />
              <Route path="notifications" element={<TechSupNotificationsPage />} />
              <Route path="profile" element={<TechnicienSupProfile />} />
              <Route path="profile/edit" element={<ProfileEdit />} />
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

            {/* Landing page route */}
            <Route path="/landing" element={<LandingPage />} />

            {/* Root route: Landing page for unauthenticated users, dashboard for authenticated users */}
            <Route
              path="/"
              element={<RootRoute />}
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
