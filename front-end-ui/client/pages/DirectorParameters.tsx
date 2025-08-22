import { Link, useNavigate } from "react-router-dom";
import { Map, Bot, Building2, Settings, ShieldCheck, User, LogOut, Trash2, Users, AlertTriangle, FileText, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import DirectorLayout from "../components/DirectorLayout";

export default function DirectorParameters() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.");
    if (!confirmed) return;
    try {
      await userService.deleteUser();
      await logout();
      navigate("/");
    } catch (e) {
      // Optionally show a toast here
      console.error(e);
    }
  };

  return (
    <DirectorLayout>
      {/* Header - Simplified and responsive */}
      <div className="mb-6 sm:mb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-sm text-gray-600 px-4 sm:px-0">
            Configuration complète du système et gestion de votre compte
          </p>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        {/* Map and Robot Configuration */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Configuration Système
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Map Configuration */}
            <div className="rounded-lg border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Configuration de la Carte</h3>
                  <p className="text-sm text-gray-600">Domaines et serres</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Définissez les emplacements des serres, les zones et les paramètres d'affichage de la carte.
                </p>
                <Link
                  to="/directeur/map-config"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full"
                >
                  Ouvrir la configuration
                </Link>
              </div>
            </div>

            {/* Robot Configuration */}
            <div className="rounded-lg border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-4 sm:p-5 lg:p-6">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Configuration des Robots</h3>
                  <p className="text-sm text-gray-600">Gestion des robots</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Gérez les paramètres des robots: connexion, zones autorisées, vitesses et comportements.
                </p>
                <Link
                  to="/directeur/robot-config"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full"
                >
                  Gérer les robots
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments and Authorizations - Combined into one section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Gestion des Assignations et Autorisations
          </h2>
          <div className="rounded-lg border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Gestion Complète des Assignations</h3>
                <p className="text-sm text-gray-600">Techniciens, superviseurs et serres</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Gérez les assignations des techniciens aux superviseurs et aux serres. Configurez les permissions d'accès et les relations hiérarchiques en un seul endroit.
              </p>
              <Link
                to="/directeur/permissions-assignments"
                className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full"
              >
                Ouvrir la gestion complète
              </Link>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Informations de l'Entreprise
          </h2>
          <div className="rounded-lg border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Informations d'Entreprise</h3>
                <p className="text-sm text-gray-600">Profil et détails</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Mettez à jour le nom, l'adresse, les contacts et les préférences de votre entreprise.
              </p>
              <Link
                to="/directeur/company-update"
                className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full"
              >
                Modifier les informations
              </Link>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            Gestion du Compte
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
              <Link
                to="/directeur/profile"
                className="w-full inline-flex items-center justify-between px-4 h-12 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-3 text-gray-800">
                  <span className="font-medium">Profil</span>
                </span>
                <span className="text-sm text-gray-500">Modifier</span>
              </Link>
              
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-between h-12"
              >
                <span className="flex items-center gap-3 text-gray-800">
                  <span className="font-medium">Déconnexion</span>
                </span>
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full justify-between h-12"
              >
                <span className="flex items-center gap-3">
                  <span className="font-medium">Supprimer le compte</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DirectorLayout>
  );
}


