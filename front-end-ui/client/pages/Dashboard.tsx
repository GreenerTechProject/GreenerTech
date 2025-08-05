import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect users to their specific dashboards
  useEffect(() => {
    if (user?.role === "directeur") {
      navigate("/directeur", { replace: true });
    } else if (user?.role === "technicien" || user?.role === "technicien_superieur") {
      navigate("/technician", { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenue, {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bienvenue sur Greener Tech
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Votre plateforme de technologie agricole intelligente.
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

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statistiques rapides
            </h3>
            <div className="space-y-3">
              {user?.role === "directeur" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entreprises affiliées</span>
                    <span className="font-medium text-[#B4CC5F]">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Demandes en attente</span>
                    <span className="font-medium text-yellow-600">2</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Projets actifs</span>
                <span className="font-medium text-[#B4CC5F]">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capteurs connectés</span>
                <span className="font-medium text-[#B4CC5F]">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dernière collecte</span>
                <span className="font-medium text-gray-900">Il y a 2h</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions rapides
            </h3>
            <div className="space-y-3">
              {user?.role === "directeur" && (
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  Gérer les affiliations
                </button>
              )}
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Nouveau projet
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Ajouter un capteur
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Voir les rapports
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Activité récente
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#B4CC5F] rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Nouveau rapport de capteur reçu - Parcelle A
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 2h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Mise à jour du système d'irrigation
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 4h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Alerte: Niveau d'humidité bas - Secteur B
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 6h</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
