import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TechHeader from "../components/TechHeader";
import { Map, AlertTriangle, BarChart3 } from "lucide-react";
import InterventionForm from "../components/InterventionForm";
import AlertHeatmap from "../components/AlertHeatmap";
import GoogleMapsWrapper from "../components/GoogleMapsWrapper";
import { GOOGLE_MAPS_CONFIG } from "../config/maps";
import { useState, useEffect } from "react";
import { AlertService } from "../services/alertService";
import { Alert } from "../types/alert";

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isInterventionFormOpen, setIsInterventionFormOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleInterventionSubmit = (data: any) => {
    console.log("Intervention submitted:", data);
    // Here you would typically send the data to your backend
    setIsInterventionFormOpen(false);
  };

  const handleInterventionSaveDraft = (data: any) => {
    console.log("Intervention draft saved:", data);
    // Here you would typically save the draft to your backend
    setIsInterventionFormOpen(false);
  };

  const openInterventionForm = () => {
    setIsInterventionFormOpen(true);
  };

  const closeInterventionForm = () => {
    setIsInterventionFormOpen(false);
  };

  // Fetch alerts for the summary
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await AlertService.getAllAlerts(1, 1000);
        setAlerts(response.alerts || []);
      } catch (error) {
        console.error("Error fetching alerts:", error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const totalAlerts = alerts.length;
  const unresolvedAlerts = alerts.filter(a => a.status === "non résolue").length;
  const urgentAlerts = alerts.filter(a => a.status_alert > 5).length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TechHeader role="technicien" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tableau de bord - Technicien
            </h1>
            <p className="text-gray-600">
              Gérez vos interventions et surveillez les alertes en temps réel
            </p>
          </div>

          {/* Alert Heatmap Section */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <GoogleMapsWrapper apiKey={GOOGLE_MAPS_CONFIG.API_KEY}>
                <AlertHeatmap height="500px" />
              </GoogleMapsWrapper>
            </div>
          </div>

          {/* Stats and Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Welcome Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Bienvenue
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                {user?.name && (
                  <p>
                    <span className="font-medium">Nom:</span> {user.name}
                  </p>
                )}
                {user?.role && (
                  <p>
                    <span className="font-medium">Rôle:</span> {user.role}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Map className="h-5 w-5 text-[#B4CC5F]" />
                Actions rapides
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate("/technician")}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#B4CC5F] rounded-md hover:bg-[#9BB54A] transition-colors flex items-center justify-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Voir la carte
                </button>
                <button 
                  onClick={openInterventionForm}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Nouvelle intervention
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                  Voir les missions
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Interventions du jour</span>
                  <span className="font-medium text-[#B4CC5F]">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Missions en cours</span>
                  <span className="font-medium text-blue-600">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rapports à compléter</span>
                  <span className="font-medium text-yellow-600">3</span>
                </div>
              </div>
            </div>

            {/* Alert Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Résumé des alertes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total alertes</span>
                  <span className="font-medium text-red-600">
                    {loading ? "..." : totalAlerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Non résolues</span>
                  <span className="font-medium text-orange-600">
                    {loading ? "..." : unresolvedAlerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgentes</span>
                  <span className="font-medium text-red-600">
                    {loading ? "..." : urgentAlerts}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Intervention Form Modal */}
      <InterventionForm
        isOpen={isInterventionFormOpen}
        onClose={closeInterventionForm}
        onSubmit={handleInterventionSubmit}
        onSaveDraft={handleInterventionSaveDraft}
      />
    </div>
  );
}
