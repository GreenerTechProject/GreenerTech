import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TechHeader from "../components/TechHeader";
import { Map } from "lucide-react";

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <TechHeader role="technicien" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bienvenue sur votre tableau de bord
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Gérez vos interventions et missions techniques.
            </p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
              <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                Nouvelle intervention
              </button>
              <button className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                Voir les missions
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
        </div>
        </main>
      </div>
    </div>
  );
}
