import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import DirectorSetupFlow from "../components/DirectorSetupFlow";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CompanyInfo {
  nom: string;
  adresse: string;
  cie: string;
  status_juridique: string;
  email: string;
}

interface Domain {
  id: string;
  name: string;
  area: number;
  center: google.maps.LatLng;
  path: google.maps.LatLng[];
  serres: Serre[];
}

interface Serre {
  id: string;
  nom: string;
  surface: number;
  domainId: string;
  guideId: string;
  position: google.maps.LatLng[];
  center: google.maps.LatLng;
  guide?: {
    id: string;
    nom: string;
    variete: string;
    rendement: number;
    date_debut_saison: Date | string;
    date_fin_saison: Date | string;
    irrigationType?: string;
    notes?: string;
  };
}

interface Technician {
  id: string;
  fullName: string;
  email: string;
  role: "technicien_superieur" | "technicien";
  assignedSerres: string[];
}

interface CompletedSetupData {
  companyInfo: CompanyInfo;
  domains: Domain[];
  technicians: Technician[];
}

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

  // Show setup wizard if user is not connected
  if (!user?.setup_completed ) {
    return <CompanySetupWizard onComplete={handleCompanySetupComplete} />;
  }

  // Show main directeur dashboard - redirect to new dashboard
  useEffect(() => {
    if (user?.setup_completed) {
      window.location.href = "/director-dashboard";
    }
  }, [user?.setup_completed]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Tableau de Bord - Directeur
              </h1>
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
              Votre plateforme de gestion d'entreprise agricole intelligente.
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
              <p>
                <span className="font-medium">Rôle:</span> Directeur
              </p>
              <p>
                <span className="font-medium">Statut:</span>
                <span className="text-[#B4CC5F] font-medium"> Connecté</span>
              </p>
            </div>
          </div>

          {/* Company Management Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gestion d'entreprise
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Entreprises affiliées</span>
                <span className="font-medium text-[#B4CC5F]">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Demandes en attente</span>
                <span className="font-medium text-yellow-600">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Projets actifs</span>
                <span className="font-medium text-[#B4CC5F]">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Employés total</span>
                <span className="font-medium text-gray-900">43</span>
              </div>
            </div>
          </div>

          {/* Director Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions directeur
            </h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Gérer les affiliations
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Approuver les projets
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Gérer les employés
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                Rapports financiers
              </button>
            </div>
          </div>
        </div>

        {/* Company Overview */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Vue d'ensemble de l'entreprise
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#B4CC5F]">
                  €124,580
                </div>
                <div className="text-sm text-gray-600">Revenus ce mois</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">15</div>
                <div className="text-sm text-gray-600">Projets en cours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-sm text-gray-600">
                  En attente d'approbation
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">98%</div>
                <div className="text-sm text-gray-600">
                  Efficacité opérationnelle
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Company Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Activité récente de l'entreprise
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#B4CC5F] rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Nouveau projet approuvé - Ferme automatisée Région Nord
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 1h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Demande d'affiliation reçue - TechAgri Solutions
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 3h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Rapport mensuel généré - Performance équipes
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 5h</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Mise à jour système - Nouvelles fonctionnalités disponibles
                </span>
                <span className="text-xs text-gray-400 ml-auto">Il y a 1j</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
