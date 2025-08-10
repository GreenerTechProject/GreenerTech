import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Register from "./pages/Register";
import RoleSelection from "./pages/RoleSelection";
import AffiliationRequest from "./pages/AffiliationRequest";
import EmailVerification from "./pages/EmailVerification";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import DirecteurSetup from "./pages/DirecteurSetup";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicienSupDashboard from "./pages/TechnicienSupDashboard";
import TechnicienRegistration from "./pages/TechnicienRegistration";
import Interventions from "./pages/Interventions";
import AlertsPage from "./pages/AlertsPage";
import SurveillancePage from "./pages/SurveillancePage";
import ReportsPage from "./pages/ReportsPage";
import Alerts from "./pages/Alerts";
import Surveillance from "./pages/Surveillance";
import RobotSurveillance from "./pages/RobotSurveillance";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";

// New Director Pages
import NewDirectorDashboard from "./pages/NewDirectorDashboard";
import TechnicianManagement from "./pages/TechnicianManagement";
import DirectorAffiliationManagement from "./pages/DirectorAffiliationManagement";
import DirectorInterventionManagement from "./pages/DirectorInterventionManagement";
import DirectorAlertManagement from "./pages/DirectorAlertManagement";
import DirectorReportManagement from "./pages/DirectorReportManagement";

const queryClient = new QueryClient();

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

            {/* Main Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy Director Dashboard (for setup) */}
             <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <DirecteurSetup />
                </ProtectedRoute>
              }
            /> 

            {/* New Director Dashboard with Sidebar */}
            <Route
              path="/directeur"
              element={
                <ProtectedRoute>
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Director Management Routes */}
            <Route
              path="/director/technicians"
              element={
                <ProtectedRoute>
                  <TechnicianManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/affiliations"
              element={
                <ProtectedRoute>
                  <DirectorAffiliationManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/interventions"
              element={
                <ProtectedRoute>
                  <DirectorInterventionManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/alerts"
              element={
                <ProtectedRoute>
                  <DirectorAlertManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/reports"
              element={
                <ProtectedRoute>
                  <DirectorReportManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/analytics"
              element={
                <ProtectedRoute>
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/director/locations"
              element={
                <ProtectedRoute>
                  <NewDirectorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Technician Routes */}
            <Route
              path="/technician"
              element={
                <ProtectedRoute>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technician-dashboard"
              element={
                <ProtectedRoute>
                  <TechnicianDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technicien-sup"
              element={
                <ProtectedRoute>
                  <TechnicienSupDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/technicien-sup-dashboard"
              element={
                <ProtectedRoute>
                  <TechnicienSupDashboard />
                </ProtectedRoute>
              }
            />

            {/* General Feature Routes */}
            <Route
              path="/interventions"
              element={
                <ProtectedRoute>
                  <Interventions />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts-view"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/surveillance"
              element={
                <ProtectedRoute>
                  <SurveillancePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/surveillance-view"
              element={
                <ProtectedRoute>
                  <Surveillance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Profile Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
