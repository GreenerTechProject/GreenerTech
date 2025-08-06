import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import DirecteurDashboard from "./pages/DirecteurDashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TechnicienSupDashboard from "./pages/TechnicienSupDashboard";
import TechnicienRegistration from "./pages/TechnicienRegistration";
import Surveillance from "./pages/Surveillance";
import Interventions from "./pages/Interventions";
import Alerts from "./pages/Alerts";
import NotFound from "./pages/NotFound";

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
            <Route
              path="/affiliation-request"
              element={<AffiliationRequest />}
            />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/technicien-registration"
              element={<TechnicienRegistration />}
            />
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/directeur"
              element={
                <ProtectedRoute>
                  <DirecteurDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/technician"
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
              path="/surveillance"
              element={
                <ProtectedRoute>
                  <Surveillance />
                </ProtectedRoute>
              }/>
                
             <Route
              path="/interventions"
              element={
                <ProtectedRoute>
                  <Interventions />
              </ProtectedRoute>
            }/>
                   
             <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
     
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
