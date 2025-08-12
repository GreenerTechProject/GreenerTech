import React, { useState, useEffect } from "react";
import TechHeader from "../components/TechHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertService } from "@/services/alertService";
import { Alert, AlertStats } from "@/types/alert";
import { useAuth } from "@/contexts/AuthContext";

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const alertsPerPage = 7;

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, [currentPage, searchTerm]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const response = await AlertService.getAllAlerts(currentPage, alertsPerPage, filters);
      setAlerts(response.alerts);
      setTotalAlerts(response.total);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await AlertService.getAlertStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleUpdateAlert = async (alertId: number, status: "résolue" | "non résolue") => {
    try {
      await AlertService.updateAlert(alertId, { status });
      loadAlerts();
      loadStats();
    } catch (error) {
      console.error("Error updating alert:", error);
    }
  };

  // Map backend status_alert integer: 0=low, 1=medium, 2=very dangerous
  const getAlertLevel = (statusAlert: number): "Low" | "Medium" | "High" => {
    if (statusAlert === 2) return "High";
    if (statusAlert === 1) return "Medium";
    return "Low";
  };

  const getAlertLevelLabel = (statusAlert: number): string => {
    if (statusAlert === 2) return "Très dangereux";
    if (statusAlert === 1) return "Moyen";
    return "Faible";
  };

  const getAlertLevelColor = (level: "High" | "Medium" | "Low"): string => {
    switch (level) {
      case "High":
        return "bg-red-100 text-red-800 border-red-300";
      case "Medium":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: "résolue" | "non résolue"): string => {
    return status === "résolue"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = Math.ceil(totalAlerts / alertsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B4CC5F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TechHeader role="technicien" />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Alertes</h1>
          <p className="text-gray-600 text-lg">Surveillez et gérez toutes les alertes de votre système</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Alerts Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500" />
              Alertes ({totalAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nom d'anomalie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Niveau</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Localisation</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Horodatage</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Aucune alerte trouvée
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert, index) => {
                      const level = getAlertLevel(alert.status_alert);
                      return (
                        <tr 
                          key={alert.id} 
                          className={cn(
                            "border-b hover:bg-gray-50",
                            index % 2 === 1 && "bg-gray-50"
                          )}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{alert.maladie}</div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getAlertLevelColor(level)}>
                              {getAlertLevelLabel(alert.status_alert)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {alert.status === "résolue" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              <span className={cn(
                                "text-sm",
                                alert.status === "résolue" ? "text-green-600" : "text-red-600"
                              )}>
                                {alert.status === "résolue" ? "Résolu" : "Non Résolu"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            Bilan ID: {alert.id_bilan}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(alert.date)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Affichage de {((currentPage - 1) * alertsPerPage) + 1} à {Math.min(currentPage * alertsPerPage, totalAlerts)} sur {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        pageNum === currentPage
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      )}
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
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertes Non Résolues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats?.unresolvedAlerts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Alertes Résolues</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.resolvedAlerts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Temps Moyen de Résolution</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.averageResolutionTime || 0}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Alertes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.totalAlerts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
