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
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.");
    if (!confirmed) return;
    try {
      await userService.deleteUser();
      await logout();
      navigate("/login");
    } catch (e) {
      // Optionally show a toast here
      console.error(e);
    }
  };

  return (
    <DirectorLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-greener flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Configuration complète du système et gestion de votre compte
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="space-y-8">
        {/* Map and Robot Configuration */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-greener-600" />
            Configuration Système
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Map Configuration */}
            <div className="rounded-xl border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-greener-50 border border-greener-200 flex items-center justify-center">
                    <Map className="w-6 h-6 text-greener-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuration de la Carte</h3>
                    <p className="text-sm text-gray-600">Domaines et serres</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Définissez les emplacements des serres, les zones et les paramètres d'affichage de la carte.
                </p>
                <Link
                  to="/directeur/map-config"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full sm:w-auto"
                >
                  Ouvrir la configuration
                </Link>
              </div>
            </div>

            {/* Robot Configuration */}
            <div className="rounded-xl border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-greener-50 border border-greener-200 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-greener-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuration des Robots</h3>
                    <p className="text-sm text-gray-600">Gestion des robots</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Gérez les paramètres des robots: connexion, zones autorisées, vitesses et comportements.
                </p>
                <Link
                  to="/directeur/robot-config"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full sm:w-auto"
                >
                  Gérer les robots
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments and Authorizations */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-greener-600" />
            Gestion des Assignations et Autorisations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Assignments Management */}
            <div className="rounded-xl border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-greener-50 border border-greener-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-greener-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Gestion des Assignations</h3>
                    <p className="text-sm text-gray-600">Techniciens et superviseurs</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Assignez techniciens aux superviseurs et aux serres. Gérez les relations hiérarchiques.
                </p>
                <Link
                  to="/directeur/assignments"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full sm:w-auto"
                >
                  Ouvrir la gestion
                </Link>
              </div>
            </div>

            {/* Authorizations */}
            <div className="rounded-xl border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-greener-50 border border-greener-200 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-greener-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Gestion des Autorisations</h3>
                    <p className="text-sm text-gray-600">Permissions et accès</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configurez les permissions d'accès aux différentes fonctionnalités du système.
                </p>
                <Link
                  to="/directeur/assignments"
                  className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full sm:w-auto"
                >
                  Configurer les autorisations
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-greener-600" />
            Informations de l'Entreprise
          </h2>
          <div className="rounded-xl border border-greener-200 bg-white hover:bg-greener-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-greener-50 border border-greener-200 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-greener-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informations d'Entreprise</h3>
                  <p className="text-sm text-gray-600">Profil et détails</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Mettez à jour le nom, l'adresse, les contacts et les préférences de votre entreprise.
              </p>
              <Link
                to="/directeur/company-update"
                className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-greener text-white text-sm font-medium hover:bg-greener-600 transition-colors w-full sm:w-auto"
              >
                Modifier les informations
              </Link>
            </div>
          </div>
        </div>

        {/* Other System Settings */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-greener-600" />
            Autres Paramètres
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Notifications */}
            <div className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuration des Notifications</h3>
                    <p className="text-sm text-gray-600">Alertes et rapports</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configurez vos préférences de notifications pour les alertes et rapports.
                </p>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Configurer
                </Button>
              </div>
            </div>

            {/* Reports */}
            <div className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuration des Rapports</h3>
                    <p className="text-sm text-gray-600">Templates et formats</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Personnalisez les templates et formats de vos rapports.
                </p>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Configurer
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-greener-600" />
            Gestion du Compte
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6 space-y-4">
              <Link
                to="/directeur/profile"
                className="w-full inline-flex items-center justify-between px-4 h-12 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-3 text-gray-800">
                  <User className="w-5 h-5" />
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
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Déconnexion</span>
                </span>
              </Button>
              
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full justify-between h-12"
              >
                <span className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5" />
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


