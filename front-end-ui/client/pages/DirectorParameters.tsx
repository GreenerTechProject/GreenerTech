import { Link } from "react-router-dom";
import { Map, Bot, Building2, Settings } from "lucide-react";

export default function DirectorParameters() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-greener flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-600">
              Configurez la carte, les robots et les informations de votre entreprise
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Map Configuration */}
          <div className="rounded-xl border border-greener-200 bg-greener-50/40 hover:bg-greener-50 transition-colors shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-greener-200 flex items-center justify-center">
                  <Map className="w-5 h-5 text-greener-700" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Configuration de la carte</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Définissez les emplacements des serres, les zones et les paramètres d'affichage de la carte.
              </p>
              <Link
                to="/directeur/map-config"
                className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-greener text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Ouvrir la configuration
              </Link>
            </div>
          </div>

          {/* Robot Configuration */}
          <div className="rounded-xl border border-greener-200 bg-greener-50/40 hover:bg-greener-50 transition-colors shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-greener-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-greener-700" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Configuration du robot</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Gérez les paramètres du robot: connexion, zones autorisées, vitesses et comportements.
              </p>
              <Link
                to="/directeur/robot-config"
                className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-greener text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Gérer le robot
              </Link>
            </div>
          </div>

          {/* Company Update */}
          <div className="rounded-xl border border-greener-200 bg-greener-50/40 hover:bg-greener-50 transition-colors shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-greener-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-greener-700" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Informations d'entreprise</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Mettez à jour le nom, l'adresse, les contacts et les préférences de votre entreprise.
              </p>
              <Link
                to="/directeur/company-update"
                className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-greener text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Modifier les informations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


