import React, { useState, useEffect } from "react";
import { Search, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AlertStatsCards from "@/components/AlertStatsCards";
import { AlertService } from "@/services/alertService";
import { Alert, AlertFilters, AlertStats } from "@/types/alert";

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    totalAlerts: 0,
    resolvedAlerts: 0,
    unresolvedAlerts: 0,
    averageResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<AlertFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const itemsPerPage = 7;

  useEffect(() => {
    loadAlertsAndStats();
  }, [currentPage, filters]);

  const loadAlertsAndStats = async () => {
    try {
      setLoading(true);
      const [alertsData, statsData] = await Promise.all([
        AlertService.getAllAlerts(currentPage, itemsPerPage, filters),
        AlertService.getAlertStats(),
      ]);
      
      setAlerts(alertsData.alerts);
      setTotalAlerts(alertsData.total);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading alerts:", error);
      // Show mock data for demo purposes
      setAlerts(getMockAlerts());
      setTotalAlerts(10);
      setStats({
        totalAlerts: 6,
        resolvedAlerts: 3,
        unresolvedAlerts: 3,
        averageResolutionTime: 2.5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters({ ...filters, search: searchQuery });
  };

  const handleStatusUpdate = async (alertId: number, newStatus: "résolue" | "non résolue") => {
    try {
      await AlertService.updateAlert(alertId, { status: newStatus });
      await loadAlertsAndStats();
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  const totalPages = Math.ceil(totalAlerts / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalAlerts);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            <div className="flex items-center space-x-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Ff73a3a377ef84690badf387e986972a1%2Fdcb76158c9bb491594b9b2a7fb796e72?format=webp&width=800"
                alt="Logo"
                className="h-12"
              />
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-600 rounded">
                  <div className="w-6 h-6 text-white">🏠</div>
                </div>
                <div className="p-2 bg-blue-600 rounded">
                  <div className="w-6 h-6 text-white">📊</div>
                </div>
                <div className="p-2 bg-blue-600 rounded">
                  <div className="w-6 h-6 text-white">📹</div>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Alertes
          </h1>
          <p className="text-gray-600">
            Surveillez et gérez toutes les alertes de votre système
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher une alerte..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Alerts Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Nom d'anomalie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Horodatage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-56"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                    </tr>
                  ))
                ) : alerts.length > 0 ? (
                  alerts.map((alert, index) => {
                    const level = AlertService.getAlertLevel(alert.status_alert);
                    const levelColor = AlertService.getAlertLevelColor(level);
                    const statusColor = AlertService.getStatusColor(alert.status);
                    
                    return (
                      <tr 
                        key={alert.id} 
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {alert.maladie}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${levelColor} border-0`}>
                            {level}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => 
                              handleStatusUpdate(
                                alert.id, 
                                alert.status === "résolue" ? "non résolue" : "résolue"
                              )
                            }
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor} hover:opacity-80 transition-opacity`}
                          >
                            {alert.status === "résolue" ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {alert.status === "résolue" ? "Résolu" : "Non Résolu"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {`Serre ${String.fromCharCode(65 + (index % 6))} / Domaine ${
                            ["Nord", "Sud", "Est", "Ouest", "Central"][index % 5]
                          } / Bilan Q${((index % 4) + 1)}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {AlertService.formatDate(alert.date)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucune alerte trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-700">
            Affichage de {startItem} à {endItem} sur {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
            
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "bg-blue-600 text-white" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <AlertStatsCards stats={stats} loading={loading} />
      </div>
    </div>
  );
}

// Mock data for demo purposes
function getMockAlerts(): Alert[] {
  return [
    {
      id: 1,
      id_bilan: 1,
      status_alert: 9,
      maladie: "Température élevée détectée",
      lien_image: "",
      x1: 33.9716,
      y1: -6.8498,
      date: "2025-07-15T14:23:00Z",
      status: "non résolue",
    },
    {
      id: 2,
      id_bilan: 2,
      status_alert: 6,
      maladie: "Humidité faible",
      lien_image: "",
      x1: 33.9720,
      y1: -6.8500,
      date: "2025-07-15T12:45:00Z",
      status: "résolue",
    },
    {
      id: 3,
      id_bilan: 3,
      status_alert: 8,
      maladie: "Défaillance capteur CO2",
      lien_image: "",
      x1: 33.9712,
      y1: -6.8495,
      date: "2025-07-15T11:30:00Z",
      status: "non résolue",
    },
    {
      id: 4,
      id_bilan: 4,
      status_alert: 3,
      maladie: "Niveau d'eau bas",
      lien_image: "",
      x1: 33.9718,
      y1: -6.8502,
      date: "2025-07-15T09:15:00Z",
      status: "résolue",
    },
    {
      id: 5,
      id_bilan: 5,
      status_alert: 7,
      maladie: "Éclairage défectueux",
      lien_image: "",
      x1: 33.9714,
      y1: -6.8497,
      date: "2025-07-15T08:42:00Z",
      status: "non résolue",
    },
    {
      id: 6,
      id_bilan: 6,
      status_alert: 4,
      maladie: "Ventilation insuffisante",
      lien_image: "",
      x1: 33.9722,
      y1: -6.8505,
      date: "2025-07-14T16:28:00Z",
      status: "résolue",
    },
  ];
}
